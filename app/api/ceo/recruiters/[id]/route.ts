import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { name, email, companyId } = await request.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });
    }

    const recruiter = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim(),
        companyId: companyId || null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            createdOffers: true
          }
        }
      }
    });

    return NextResponse.json(recruiter);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du recruteur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier s'il y a des offres d'emploi créées par ce recruteur
    const recruiter = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdOffers: true
          }
        }
      }
    });

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruteur non trouvé' }, { status: 404 });
    }

    if (recruiter._count.createdOffers > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un recruteur qui a créé des offres d\'emploi' 
      }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Recruteur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression du recruteur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
