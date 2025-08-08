"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Container } from '@/components/layout/container';
import { Loader2, ArrowLeft, Briefcase, Building, Calendar, Clock, Users, CheckCircle, AlertCircle, Star, Zap } from 'lucide-react';

type JobOfferDetails = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  deadline: string | null;
  createdAt: string;
  company: { 
    name: string;
    description?: string;
  };
  _count?: {
    applications: number;
  };
};

export default function JobDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<JobOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
      if (session?.user?.role === 'CANDIDATE') {
        checkApplicationStatus();
      }
    }
  }, [params.id, session]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/job-offers/public`);
      if (response.ok) {
        const jobs = await response.json();
        const currentJob = jobs.find((j: any) => j.id === params.id);
        if (currentJob) {
          setJob(currentJob);
        } else {
          toast({ title: "Erreur", description: "Offre non trouvée", variant: "destructive" });
          router.push('/jobs');
        }
      }
    } catch (error) {
      console.error("Failed to fetch job details", error);
      toast({ title: "Erreur", description: "Impossible de charger l'offre", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const applications = await response.json();
        const hasAppliedToThisJob = applications.some((app: any) => app.jobOffer.id === params.id);
        setHasApplied(hasAppliedToThisJob);
      }
    } catch (error) {
      console.error("Failed to check application status", error);
    }
  };

  const handleApply = async () => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/jobs/${params.id}`);
      return;
    }

    if (session.user.role !== 'CANDIDATE') {
      toast({ 
        title: "Accès refusé", 
        description: "Seuls les candidats peuvent postuler", 
        variant: "destructive" 
      });
      return;
    }

    if (hasApplied) {
      toast({ 
        title: "Déjà postulé", 
        description: "Vous avez déjà postulé à cette offre", 
        variant: "destructive" 
      });
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`/api/job-offers/${params.id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        setHasApplied(true);
        
        if (result.status === 'TEST_PENDING') {
          toast({ 
            title: "Félicitations ! 🎉", 
            description: `Votre CV a été accepté avec un score de ${result.cvScore}%. Un test technique vous attend dans votre dashboard.`,
            duration: 6000,
          });
        } else {
          toast({ 
            title: "Candidature reçue", 
            description: `Votre candidature a été enregistrée. Score CV: ${result.cvScore}%. Malheureusement, le score requis n'a pas été atteint.`,
            variant: "destructive",
            duration: 6000,
          });
        }
        
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        const error = await response.json();
        toast({ 
          title: "Erreur", 
          description: error.error || "Impossible de postuler", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur réseau", variant: "destructive" });
    }
    setApplying(false);
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', text: 'Offre expirée', color: 'bg-red-100 text-red-800', urgent: true };
    } else if (diffDays <= 3) {
      return { status: 'urgent', text: `${diffDays} jour(s) restant(s)`, color: 'bg-orange-100 text-orange-800', urgent: true };
    } else if (diffDays <= 7) {
      return { status: 'soon', text: `${diffDays} jours restants`, color: 'bg-yellow-100 text-yellow-800', urgent: false };
    } else {
      return { status: 'normal', text: `Jusqu'au ${deadlineDate.toLocaleDateString('fr-FR')}`, color: 'bg-blue-100 text-blue-800', urgent: false };
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex h-96 justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Chargement de l'offre...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container>
        <div className="flex h-96 justify-center items-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Offre non trouvée</h2>
            <p className="text-muted-foreground mb-4">Cette offre d'emploi n'existe pas ou a été supprimée.</p>
            <Button asChild>
              <Link href="/jobs">Retour aux offres</Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const deadlineStatus = getDeadlineStatus(job.deadline);
  const isExpired = deadlineStatus?.status === 'expired';
  const applicationCount = job._count?.applications || 0;

  return (
    <Container>
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux offres
          </Button>
        </div>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center text-lg">
                      <Building className="w-4 h-4 mr-2" />
                      {job.company.name}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Status badges */}
                <div className="flex items-center gap-3 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {applicationCount} candidature{applicationCount !== 1 ? 's' : ''}
                  </Badge>
                  
                  {deadlineStatus && (
                    <Badge className={`flex items-center gap-1 ${deadlineStatus.color}`}>
                      {deadlineStatus.urgent ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {deadlineStatus.text}
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Publié le {new Date(job.createdAt).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Description du poste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description || "Aucune description détaillée fournie pour ce poste."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Compétences requises
                </CardTitle>
                <CardDescription>
                  Ces compétences sont utilisées pour l'évaluation automatique de votre CV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {job.skills.length === 0 && (
                  <p className="text-muted-foreground italic">Aucune compétence spécifique mentionnée</p>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.company.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-500" />
                    À propos de l'entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {job.company.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Card */}
            <Card className={isExpired ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {hasApplied ? 'Candidature envoyée' : 'Postuler maintenant'}
                </CardTitle>
                {!hasApplied && (
                  <CardDescription>
                    Votre CV sera automatiquement évalué par notre IA
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Vous avez déjà postulé à cette offre
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard">
                        Voir mes candidatures
                      </Link>
                    </Button>
                  </div>
                ) : isExpired ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-red-600 font-medium">
                      Cette offre a expiré
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!session ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          Connectez-vous pour postuler
                        </p>
                      </div>
                    ) : session.user.role !== 'CANDIDATE' ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-orange-600 mb-3">
                          Seuls les candidats peuvent postuler
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">Processus de candidature :</h4>
                        <div className="text-sm text-blue-800 space-y-2">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">1</span>
                            Évaluation automatique de votre CV
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">2</span>
                            Test technique si score ≥ 75%
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">3</span>
                            Entretien final
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleApply} 
                      disabled={applying || isExpired} 
                      className="w-full"
                      size="lg"
                    >
                      {applying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : session?.user.role === 'CANDIDATE' ? (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Postuler maintenant
                        </>
                      ) : (
                        'Se connecter pour postuler'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Candidatures</span>
                  <span className="font-medium">{applicationCount}</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de publication</span>
                  <span className="font-medium">
                    {new Date(job.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                {job.deadline && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date limite</span>
                      <span className="font-medium">
                        {new Date(job.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compétences</span>
                  <span className="font-medium">{job.skills.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-900">💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• Assurez-vous que votre CV contient les compétences mentionnées</li>
                  <li>• Un CV bien structuré améliore votre score</li>
                  <li>• L'expérience pertinente est valorisée</li>
                  <li>• Préparez-vous au test technique si sélectionné</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
