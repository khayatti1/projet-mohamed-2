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

    // Statistiques principales
    const [
      totalCompanies,
      totalRecruiters,
      totalJobOffers,
      totalApplications,
      acceptedApplications,
      pendingApplications,
      rejectedApplications,
      testPendingApplications
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count({ where: { role: 'RECRUITER' } }),
      prisma.jobOffer.count(),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { status: 'TEST_PENDING' } })
    ]);

    // Calculer le taux de succès
    const successRate = totalApplications > 0 
      ? Math.round((acceptedApplications / totalApplications) * 100)
      : 0;

    // Entreprises récentes
    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            jobOffers: true
          }
        }
      }
    });

    // Top recruteurs
    const topRecruiters = await prisma.user.findMany({
      where: { role: 'RECRUITER' },
      take: 5,
      include: {
        company: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            createdOffers: true
          }
        }
      },
      orderBy: {
        createdOffers: {
          _count: 'desc'
        }
      }
    });

    const stats = {
      totalCompanies,
      totalRecruiters,
      totalJobOffers,
      totalApplications,
      acceptedApplications,
      pendingApplications: pendingApplications + testPendingApplications,
      rejectedApplications,
      successRate
    };

    return NextResponse.json({
      stats,
      recentCompanies: recentCompanies.map(company => ({
        id: company.id,
        name: company.name,
        description: company.description || '',
        location: company.location || '',
        recruitersCount: company._count.users,
        jobOffersCount: company._count.jobOffers,
        createdAt: company.createdAt.toISOString()
      })),
      topRecruiters: topRecruiters.map(recruiter => ({
        id: recruiter.id,
        name: recruiter.name || '',
        email: recruiter.email,
        company: recruiter.company?.name || 'Aucune entreprise',
        jobOffersCount: recruiter._count.createdOffers,
        createdAt: recruiter.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
