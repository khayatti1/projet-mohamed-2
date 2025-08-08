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
    const { name, description, location, website } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom de l\'entreprise est requis' }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        location: location?.trim() || '',
        website: website?.trim() || ''
      },
      include: {
        _count: {
          select: {
            users: true,
            jobOffers: true
          }
        }
      }
    });

    return NextResponse.json(company);

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'entreprise:', error);
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

    // Vérifier s'il y a des utilisateurs ou des offres d'emploi liés
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            jobOffers: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    if (company._count.users > 0 || company._count.jobOffers > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer une entreprise qui a des utilisateurs ou des offres d\'emploi associés' 
      }, { status: 400 });
    }

    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Entreprise supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
