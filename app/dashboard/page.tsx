import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CEODashboard from '@/components/dashboards/ceo-dashboard';
import RecruiterDashboard from '@/components/dashboards/recruiter-dashboard';
import CandidateDashboard from '@/components/dashboards/candidate-dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const { user } = session;

  switch (user.role) {
    case 'CEO':
      return <CEODashboard />;
    case 'RECRUITER':
      return <RecruiterDashboard />;
    case 'CANDIDATE':
      return <CandidateDashboard user={user} />;
    default:
      redirect('/');
  }
}
