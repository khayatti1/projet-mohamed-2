import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'offre appartient au recruteur
    const jobOffer = await prisma.jobOffer.findFirst({
      where: { id, recruiterId: session.user.id }
    });

    if (!jobOffer) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 });
    }

    // Récupérer les statistiques
    const applications = await prisma.application.findMany({
      where: { jobOfferId: id },
      select: { cvScore: true, status: true }
    });

    const totalApplications = applications.length;
    const acceptedForTest = applications.filter(app => app.status === 'TEST_PENDING').length;
    const testPendingCount = acceptedForTest;
    
    const successRate = totalApplications > 0 
      ? ((acceptedForTest / totalApplications) * 100).toFixed(1)
      : '0';

    const averageCvScore = totalApplications > 0
      ? applications.reduce((sum, app) => sum + (app.cvScore || 0), 0) / totalApplications
      : 0;

    return NextResponse.json({
      totalApplications,
      successRate: `${successRate}%`,
      averageCvScore,
      testPendingCount,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
