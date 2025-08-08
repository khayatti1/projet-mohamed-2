import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    // Vérifier les permissions
    if (session.user.role === 'CANDIDATE' && session.user.id !== userId) {
      return new NextResponse('Accès refusé', { status: 403 });
    }

    if (!['RECRUITER', 'CEO'].includes(session.user.role) && session.user.id !== userId) {
      return new NextResponse('Accès refusé', { status: 403 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, cvUrl: true }
    });

    if (!user) {
      return new NextResponse('Utilisateur non trouvé', { status: 404 });
    }

    // Si l'utilisateur a un CV uploadé, le retourner
    if (user.cvUrl) {
      const filePath = join(process.cwd(), user.cvUrl.replace('/', ''));
      
      if (existsSync(filePath)) {
        const fileBuffer = readFileSync(filePath);
        const fileName = `cv-${user.name?.replace(/\s+/g, '-').toLowerCase() || userId}.pdf`;
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    // Sinon, retourner un CV par défaut (pour la compatibilité)
    const defaultCvContent = `
CV de ${user.name || 'Candidat'}
Email: ${user.email}

Profil:
Candidat motivé recherchant de nouvelles opportunités professionnelles.

Formation:
- Formation en cours

Compétences:
- À définir selon le profil

Expérience:
- À compléter

Contact: ${user.email}
    `;

    const fileName = `cv-${user.name?.replace(/\s+/g, '-').toLowerCase() || userId}.txt`;

    return new NextResponse(defaultCvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du CV:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}
