import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        company: true,
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
      }
    });

    if (!jobOffer) {
      return NextResponse.json({ error: 'Offre d\'emploi non trouvée' }, { status: 404 });
    }

    return NextResponse.json(jobOffer);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'offre d\'emploi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingOffer = await prisma.jobOffer.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offre d\'emploi non trouvée' }, { status: 404 });
    }

    if (existingOffer.recruiterId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const updatedOffer = await prisma.jobOffer.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        location: body.location,
        salary: body.salary || '',
        contractType: body.contractType || 'CDI',
        experienceLevel: body.experienceLevel || 'Junior',
        skills: body.skills || []
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

    return NextResponse.json(updatedOffer);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre d\'emploi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const existingOffer = await prisma.jobOffer.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offre d\'emploi non trouvée' }, { status: 404 });
    }

    if (existingOffer.recruiterId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.jobOffer.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Offre d\'emploi supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre d\'emploi:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
