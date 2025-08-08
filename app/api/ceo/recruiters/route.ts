import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const recruiters = await prisma.user.findMany({
      where: {
        role: 'RECRUITER'
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(recruiters);

  } catch (error) {
    console.error('Erreur lors de la récupération des recruteurs:', error);
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const companyId = formData.get('companyId') as string;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !companyId?.trim()) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    // Vérifier que l'entreprise existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const recruiter = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        role: 'RECRUITER',
        companyId: companyId
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
    console.error('Erreur lors de la création du recruteur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
