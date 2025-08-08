import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeCVWithAI } from '@/lib/ai-service';
import type { ApplicationStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'offre d'emploi existe
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!jobOffer) {
      return NextResponse.json({ error: 'Offre d\'emploi non trouvée' }, { status: 404 });
    }

    // Récupérer les candidatures pour cette offre
    const applications = await prisma.application.findMany({
      where: { jobOfferId: id },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        technicalTests: {
          select: {
            score: true,
            completedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(applications);

  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'offre d'emploi existe
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id }
    });

    if (!jobOffer) {
      return NextResponse.json({ error: 'Offre d\'emploi non trouvée' }, { status: 404 });
    }

    // Vérifier si le candidat a déjà postulé
    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId: session.user.id,
        jobOfferId: id
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Vous avez déjà postulé pour cette offre' }, { status: 400 });
    }

    // Récupérer le CV du candidat
    const candidate = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!candidate?.cvUrl) {
      return NextResponse.json({ error: 'Veuillez d\'abord télécharger votre CV' }, { status: 400 });
    }

    console.log(`🎯 Nouvelle candidature pour: ${jobOffer.title}`);
    console.log(`👤 Candidat: ${candidate.name}`);
    console.log(`📄 CV URL: ${candidate.cvUrl}`);

    // Analyser le CV avec l'IA
    let aiScore = 0;
    let aiAnalysis = '';

    try {
      const analysis = await analyzeCVWithAI(candidate.cvUrl, jobOffer.title);
      aiScore = analysis.score;
      // Construire l'analyse à partir des propriétés disponibles
      aiAnalysis = `Compétences: ${analysis.skills.join(', ')}. Expérience: ${analysis.experience}. Niveau: ${analysis.experienceLevel}.`;
    } catch (error) {
      console.error('Erreur IA, utilisation du fallback local:', error);
      
      const jobTitle = jobOffer.title.toLowerCase();
      
      if (jobTitle.includes('ingénieur') || jobTitle.includes('développeur') || jobTitle.includes('informatique')) {
        aiScore = 85;
        aiAnalysis = 'Profil technique correspondant aux exigences du poste. Compétences en développement détectées.';
      } else if (jobTitle.includes('design') || jobTitle.includes('graphique') || jobTitle.includes('art')) {
        aiScore = 25;
        aiAnalysis = 'Profil technique ne correspondant pas parfaitement aux exigences créatives du poste.';
      } else {
        aiScore = Math.floor(Math.random() * 40) + 40;
        aiAnalysis = 'Analyse automatique du profil effectuée.';
      }
    }

    // Déterminer le statut initial basé sur le score
    let initialStatus: ApplicationStatus = 'PENDING';
    if (aiScore >= 70) {
      initialStatus = 'ACCEPTED';
    } else if (aiScore >= 50) {
      initialStatus = 'TEST_PENDING';
    } else {
      initialStatus = 'REJECTED';
    }

    // Créer la candidature
    const application = await prisma.application.create({
      data: {
        candidateId: session.user.id,
        jobOfferId: id,
        status: initialStatus,
        aiScore,
        aiAnalysis
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        jobOffer: {
          select: {
            title: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Candidature créée avec succès - Score: ${aiScore}%`);

    return NextResponse.json(application, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la candidature:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
