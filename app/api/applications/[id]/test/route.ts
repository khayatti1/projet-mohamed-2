import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTechnicalTest } from '@/lib/ai-service';

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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        jobOffer: {
          include: {
            company: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Candidature non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le candidat de cette candidature
    if (session.user.role === 'CANDIDATE' && application.candidateId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que le statut permet de passer le test
    if (application.status !== 'TEST_PENDING' && application.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Test non disponible pour cette candidature' }, { status: 400 });
    }

    // Générer ou récupérer les questions du test
    const existingTest = await prisma.technicalTest.findFirst({
      where: { applicationId: id }
    });

    let questions;
    if (existingTest && existingTest.questions) {
      questions = JSON.parse(existingTest.questions);
    } else {
      // Générer les questions du test
      const experienceLevel: 'Junior' | 'Mid-level' | 'Senior' = 
        application.aiScore && application.aiScore >= 80 ? 'Senior' : 
        application.aiScore && application.aiScore >= 60 ? 'Mid-level' : 'Junior';
      
      const cvAnalysis = {
        score: application.aiScore || 0,
        skills: application.jobOffer.skills || [],
        experience: 'Analysé automatiquement',
        education: 'Formation détectée',
        projects: [],
        languages: ['Français'],
        recommendations: [],
        experienceLevel: experienceLevel
      };

      questions = await generateTechnicalTest(
        application.jobOffer.title,
        application.jobOffer.skills || [],
        cvAnalysis
      );

      // Sauvegarder les questions dans la base de données
      await prisma.technicalTest.create({
        data: {
          applicationId: id,
          userId: application.candidateId,
          questions: JSON.stringify(questions)
        }
      });
    }

    return NextResponse.json({
      questions,
      jobTitle: application.jobOffer.title,
      companyName: application.jobOffer.company.name
    });

  } catch (error) {
    console.error('Erreur lors de la génération du test:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { answers } = await request.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        jobOffer: {
          include: {
            company: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Candidature non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le candidat de cette candidature
    if (session.user.role === 'CANDIDATE' && application.candidateId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer le test technique
    const test = await prisma.technicalTest.findFirst({
      where: { applicationId: id }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test non trouvé' }, { status: 404 });
    }

    // Vérifier que le test n'a pas déjà été complété
    if (test.completedAt) {
      return NextResponse.json({ error: 'Test déjà passé' }, { status: 400 });
    }

    // Calculer le score
    const questions = JSON.parse(test.questions);
    let correctAnswers = 0;

    answers.forEach((answer: number, index: number) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    // Déterminer le nouveau statut - Si score >= 60%, candidature acceptée
    const newStatus = score >= 60 ? 'ACCEPTED' : 'REJECTED';

    // Mettre à jour le test technique
    await prisma.technicalTest.update({
      where: { id: test.id },
      data: {
        answers: JSON.stringify(answers),
        score,
        completedAt: new Date()
      }
    });

    // Mettre à jour la candidature avec le nouveau statut
    await prisma.application.update({
      where: { id },
      data: {
        status: newStatus
      }
    });

    return NextResponse.json({ score, status: newStatus });

  } catch (error) {
    console.error('Erreur lors de la soumission du test:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
