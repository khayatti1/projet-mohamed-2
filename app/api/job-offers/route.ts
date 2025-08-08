import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let jobOffers;

    if (session.user.role === 'RECRUITER') {
      // Les recruteurs ne voient que leurs propres offres
      jobOffers = await prisma.jobOffer.findMany({
        where: {
          recruiterId: session.user.id
        },
        include: {
          company: {
            select: {
              name: true,
              location: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (session.user.role === 'CEO') {
      // Les CEOs voient toutes les offres
      jobOffers = await prisma.jobOffer.findMany({
        include: {
          company: {
            select: {
              name: true,
              location: true
            }
          },
          recruiter: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(jobOffers);

  } catch (error) {
    console.error('Erreur lors de la récupération des offres d\'emploi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      requirements, 
      location, 
      salary, 
      type,
      skills 
    } = body;

    // Validation des champs requis
    if (!title || !description || !requirements || !location) {
      return NextResponse.json({ 
        error: 'Tous les champs obligatoires doivent être remplis' 
      }, { status: 400 });
    }

    // Récupérer l'utilisateur avec son entreprise
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user || !user.company) {
      return NextResponse.json({ 
        error: 'Utilisateur ou entreprise non trouvé' 
      }, { status: 404 });
    }

    // Créer l'offre d'emploi
    const jobOffer = await prisma.jobOffer.create({
      data: {
        title,
        description,
        requirements,
        location,
        salary: salary || '',
        contractType: type || 'FULL_TIME',
        experienceLevel: 'Junior',
        skills: skills || [],
        companyId: user.company.id,
        recruiterId: session.user.id
      },
      include: {
        company: {
          select: {
            name: true,
            location: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    return NextResponse.json(jobOffer, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'offre d\'emploi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
