import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password, role, companyName } = await request.json();

    if (!name || !email || !password || !role) {
      return new NextResponse('Tous les champs sont requis', { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse('Un utilisateur avec cet email existe déjà', { status: 400 });
    }

    // Valider le rôle
    if (!['CANDIDATE', 'RECRUITER', 'CEO'].includes(role)) {
      return new NextResponse('Rôle invalide', { status: 400 });
    }

    // Pour les CEO, le nom de l'entreprise est requis
    if (role === 'CEO' && !companyName?.trim()) {
      return new NextResponse('Le nom de l\'entreprise est requis pour les CEO', { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    let userData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    };

    // Si c'est un CEO, créer d'abord l'entreprise
    if (role === 'CEO') {
      const company = await prisma.company.create({
        data: {
          name: companyName.trim(),
          description: `Entreprise dirigée par ${name.trim()}`
        }
      });

      // Créer l'utilisateur CEO avec l'entreprise
      const user = await prisma.user.create({
        data: {
          ...userData,
          companyId: company.id
        }
      });

      console.log('✅ CEO et entreprise créés avec succès:', user.name, company.name);

      return NextResponse.json({ 
        message: 'Compte CEO créé avec succès',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }

    // Pour les autres rôles (CANDIDATE, RECRUITER), pas d'entreprise automatique
    const user = await prisma.user.create({
      data: userData
    });

    console.log('✅ Utilisateur créé avec succès:', user.name, user.role);

    return NextResponse.json({ 
      message: 'Compte créé avec succès',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}
