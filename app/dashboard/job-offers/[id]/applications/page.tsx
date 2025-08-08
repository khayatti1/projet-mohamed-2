"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, ArrowLeft, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, FileText, BarChart3, Eye, Star } from 'lucide-react';

type Application = {
  id: string;
  status: string;
  cvScore: number;
  testScore: number | null;
  createdAt: string;
  candidate: { 
    name: string; 
    email: string; 
    cvUrl: string | null;
  };
};

type JobOffer = {
  id: string;
  title: string;
  company: { name: string };
  _count: { applications: number };
};

type Stats = { 
  totalApplications: number; 
  successRate: string;
  averageCvScore: number;
  testPendingCount: number;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'PENDING_CV_REVIEW':
      return { text: 'En attente', color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-3 h-3" /> };
    case 'CV_REJECTED':
      return { text: 'CV Rejeté', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> };
    case 'TEST_PENDING':
      return { text: 'Test en attente', color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="w-3 h-3" /> };
    case 'TEST_IN_PROGRESS':
      return { text: 'Test en cours', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> };
    case 'TEST_COMPLETED':
      return { text: 'Test terminé', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> };
    case 'FINAL_INTERVIEW':
      return { text: 'Entretien final', color: 'bg-purple-100 text-purple-800', icon: <Users className="w-3 h-3" /> };
    case 'HIRED':
      return { text: 'Embauché', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> };
    case 'REJECTED':
      return { text: 'Rejeté', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> };
    default:
      return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" /> };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600 font-bold';
  if (score >= 75) return 'text-blue-600 font-semibold';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export default function JobApplicationsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'RECRUITER') {
      router.push('/auth/signin');
      return;
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, session, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchApplications(),
        fetchJobOffer(),
        fetchStats()
      ]);
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les données", 
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    const response = await fetch(`/api/job-offers/${params.id}/applications`);
    if (response.ok) {
      const data = await response.json();
      setApplications(data);
    } else if (response.status === 404) {
      toast({ 
        title: "Accès refusé", 
        description: "Cette offre ne vous appartient pas", 
        variant: "destructive" 
      });
      router.push('/dashboard');
    }
  };

  const fetchJobOffer = async () => {
    const response = await fetch('/api/job-offers');
    if (response.ok) {
      const offers = await response.json();
      const currentOffer = offers.find((offer: any) => offer.id === params.id);
      setJobOffer(currentOffer);
    }
  };

  const fetchStats = async () => {
    const response = await fetch(`/api/job-offers/${params.id}/stats`);
    if (response.ok) {
      const data = await response.json();
      setStats(data);
    }
  };

  const filteredApplications = applications.filter(app => {
    switch (activeTab) {
      case 'pending': return app.status === 'TEST_PENDING';
      case 'completed': return app.status === 'TEST_COMPLETED';
      case 'rejected': return app.status === 'CV_REJECTED';
      default: return true;
    }
  });

  if (status === 'loading' || loading) {
    return (
      <Container>
        <div className="flex h-96 justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Chargement des candidatures...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au dashboard
          </Button>
        </div>

        <PageHeader 
          title={jobOffer ? `Candidatures - ${jobOffer.title}` : 'Candidatures'}
          description={jobOffer ? `${jobOffer.company.name} • ${applications.length} candidature${applications.length !== 1 ? 's' : ''} reçue${applications.length !== 1 ? 's' : ''}` : 'Gestion des candidatures'}
        />

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-muted-foreground">candidatures reçues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successRate}</div>
                <p className="text-xs text-muted-foreground">CV acceptés (≥75%)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(stats.averageCvScore)}`}>
                  {stats.averageCvScore.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">score CV moyen</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tests en attente</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.testPendingCount}</div>
                <p className="text-xs text-muted-foreground">candidats qualifiés</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Liste des candidatures
            </CardTitle>
            <CardDescription>
              Consultez et gérez toutes les candidatures pour cette offre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  Toutes ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Tests en attente ({applications.filter(a => a.status === 'TEST_PENDING').length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Tests terminés ({applications.filter(a => a.status === 'TEST_COMPLETED').length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejetées ({applications.filter(a => a.status === 'CV_REJECTED').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {activeTab === 'all' ? 'Aucune candidature' : `Aucune candidature ${activeTab === 'pending' ? 'en attente' : activeTab === 'completed' ? 'terminée' : 'rejetée'}`}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'all' 
                        ? 'Les candidatures apparaîtront ici une fois reçues.'
                        : 'Changez de filtre pour voir d\'autres candidatures.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Candidat</TableHead>
                          <TableHead className="font-semibold text-center">Score CV</TableHead>
                          <TableHead className="font-semibold text-center">Score Test</TableHead>
                          <TableHead className="font-semibold text-center">Statut</TableHead>
                          <TableHead className="font-semibold text-center">Date</TableHead>
                          <TableHead className="font-semibold text-center">CV</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map(app => {
                          const statusInfo = getStatusInfo(app.status);
                          return (
                            <TableRow key={app.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <div className="font-medium">{app.candidate.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {app.candidate.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`font-semibold ${getScoreColor(app.cvScore)}`}>
                                    {app.cvScore}%
                                  </span>
                                  {app.cvScore >= 85 && <Star className="w-3 h-3 text-yellow-500" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {app.testScore ? (
                                  <span className={`font-semibold ${getScoreColor(app.testScore)}`}>
                                    {app.testScore}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit mx-auto`}>
                                  {statusInfo.icon}
                                  {statusInfo.text}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-center">
                                {app.candidate.cvUrl ? (
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={app.candidate.cvUrl} target="_blank">
                                      <Eye className="mr-2 h-3 w-3" />
                                      Voir
                                    </Link>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Non disponible</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Scoring Criteria Info */}
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Critères d'évaluation IA
            </CardTitle>
            <CardDescription className="text-blue-700">
              Comment notre IA évalue les CV des candidats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Critères principaux (Score ≥ 75%)</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Compétences techniques :</strong> Correspondance avec les compétences requises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Expérience pertinente :</strong> Années d'expérience dans le domaine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Formation :</strong> Diplômes et certifications en rapport</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Projets réalisés :</strong> Portfolio et réalisations concrètes</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Barème de notation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-green-100 rounded">
                    <span className="text-green-800">85-100% : Excellent</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-100 rounded">
                    <span className="text-blue-800">75-84% : Qualifié pour le test</span>
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-100 rounded">
                    <span className="text-orange-800">60-74% : Profil intéressant</span>
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-100 rounded">
                    <span className="text-red-800">{'<'}60% : Non qualifié</span>
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
