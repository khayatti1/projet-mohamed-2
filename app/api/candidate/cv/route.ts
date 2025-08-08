import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CANDIDATE') {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      return new NextResponse('Aucun fichier fourni', { status: 400 });
    }

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse('Type de fichier non supporté. Utilisez PDF ou TXT.', { status: 400 });
    }

    // Récupérer les informations du candidat
    const candidate = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    if (!candidate) {
      return new NextResponse('Candidat non trouvé', { status: 404 });
    }

    // Créer le nom de fichier avec nom-prénom
    const candidateName = candidate.name || 'candidat';
    const cleanName = candidateName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const extension = file.name.split('.').pop();
    const fileName = `cv-${cleanName}.${extension}`;

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Sauvegarder le fichier
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Mettre à jour l'URL du CV dans la base de données
    const cvUrl = `/api/uploads/${fileName}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { cvUrl }
    });

    console.log(`✅ CV uploadé avec succès: ${fileName}`);

    return NextResponse.json({
      message: 'CV uploadé avec succès',
      cvUrl,
      fileName
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload du CV:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}
