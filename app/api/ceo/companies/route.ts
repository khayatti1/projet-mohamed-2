import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            jobOffers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(companies);

  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const website = formData.get('website') as string;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom de l\'entreprise est requis' }, { status: 400 });
    }

    const company = await prisma.company.create({
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
    console.error('Erreur lors de la création de l\'entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
