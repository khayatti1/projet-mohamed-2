"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, FileText, CheckCircle, XCircle, ClipboardEdit, Upload, ExternalLink, Bell, Star, TrendingUp } from 'lucide-react';

type Application = {
  id: string;
  status: string;
  cvScore: number;
  testScore: number | null;
  jobOffer: {
    title: string;
    company: { name: string };
  };
  createdAt: string;
};

function getStatusInfo(status: string, testScore?: number | null) {
  switch (status) {
    case "TEST_PENDING": 
      return { 
        text: "Test à passer", 
        variant: "default" as const, 
        icon: <ClipboardEdit className="w-3 h-3" />,
        color: "bg-blue-100 text-blue-800",
        notification: "🎯 Un test technique vous attend !"
      };
    case "TEST_IN_PROGRESS": 
      return { 
        text: "Test en cours", 
        variant: "secondary" as const, 
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        color: "bg-yellow-100 text-yellow-800",
        notification: "⏳ Test en cours de traitement..."
      };
    case "TEST_COMPLETED": 
      return { 
        text: `Test terminé (${testScore}%)`, 
        variant: "default" as const, 
        icon: <CheckCircle className="w-3 h-3" />,
        color: "bg-green-100 text-green-800",
        notification: `✅ Test terminé avec ${testScore}% !`
      };
    case "CV_REJECTED": 
      return { 
        text: "CV non retenu", 
        variant: "destructive" as const, 
        icon: <XCircle className="w-3 h-3" />,
        color: "bg-red-100 text-red-800",
        notification: "❌ CV non retenu pour ce poste"
      };
    default: 
      return { 
        text: "En attente", 
        variant: "secondary" as const, 
        icon: <FileText className="w-3 h-3" />,
        color: "bg-gray-100 text-gray-800",
        notification: "📋 Candidature en cours d'examen"
      };
  }
}

export default function CandidateDashboard({ user }: { user: any }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState(user.cvUrl || '');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
        
        // Afficher les notifications pour les nouveaux statuts
        data.forEach((app: Application) => {
          const statusInfo = getStatusInfo(app.status, app.testScore);
          if (app.status === 'TEST_PENDING') {
            toast({
              title: "🎯 Test technique disponible !",
              description: `Un test vous attend pour le poste "${app.jobOffer.title}" chez ${app.jobOffer.company.name}`,
              duration: 8000,
            });
          }
        });
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les candidatures", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur réseau", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Erreur", description: "Seuls les fichiers PDF sont acceptés", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({ title: "Erreur", description: "Le fichier ne doit pas dépasser 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('/api/candidate/cv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCvUrl(data.cvUrl);
        toast({ 
          title: "✅ Succès", 
          description: "CV téléversé avec succès ! Votre profil est maintenant complet.",
          duration: 5000,
        });
      } else {
        toast({ title: "Erreur", description: "Impossible de téléverser le CV", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur réseau", variant: "destructive" });
    }
    setUploading(false);
  };

  // Statistiques pour le candidat
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'TEST_PENDING').length,
    completed: applications.filter(app => app.status === 'TEST_COMPLETED').length,
    avgScore: applications.length > 0 
      ? Math.round(applications.reduce((sum, app) => sum + app.cvScore, 0) / applications.length)
      : 0
  };

  return (
    <Container>
      <PageHeader 
        title={`Bonjour ${user.name} 👋`}
        description="Suivez vos candidatures et gérez votre profil"
      >
        <Button asChild variant="outline">
          <Link href="/jobs">
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir les offres
          </Link>
        </Button>
      </PageHeader>
      
      {/* Notifications importantes */}
      {stats.pending > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                {stats.pending} test{stats.pending > 1 ? 's' : ''} technique{stats.pending > 1 ? 's' : ''} en attente !
              </h3>
              <p className="text-sm text-blue-700">
                Passez vos tests pour augmenter vos chances d'être sélectionné.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Statistiques rapides */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Candidatures</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <ClipboardEdit className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Tests en attente</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Tests terminés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.avgScore}%</div>
                  <div className="text-sm text-muted-foreground">Score moyen CV</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mes candidatures
              </CardTitle>
              <CardDescription>
                Suivez l'avancement de toutes vos candidatures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune candidature</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par postuler à des offres qui vous intéressent
                  </p>
                  <Button asChild>
                    <Link href="/jobs">
                      Voir les offres disponibles
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const statusInfo = getStatusInfo(app.status, app.testScore);
                    return (
                      <div key={app.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{app.jobOffer.title}</h3>
                            <p className="text-sm text-muted-foreground">{app.jobOffer.company.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>Score CV: {app.cvScore}%</span>
                            </div>
                            {app.testScore && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>Score Test: {app.testScore}%</span>
                              </div>
                            )}
                          </div>
                          
                          {app.status === "TEST_PENDING" && (
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Link href={`/test/${app.id}`}>
                                <ClipboardEdit className="w-3 h-3 mr-2" />
                                Passer le test
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Mon profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv-upload">Mon CV</Label>
                <Input 
                  id="cv-upload" 
                  type="file" 
                  accept=".pdf"
                  onChange={handleCvUpload} 
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Téléversement en cours...
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Format PDF uniquement, taille max: 5MB
                </p>
              </div>
              
              {cvUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="w-3 h-3" />
                    CV téléversé avec succès
                  </div>
                  <a 
                    href={cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-green-600 hover:underline mt-1 block"
                  >
                    Voir mon CV
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conseils pour améliorer le profil */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 flex items-center gap-2">
                <Star className="w-4 h-4" />
                💡 Conseils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• Assurez-vous que votre CV contient les compétences demandées</li>
                <li>• Mentionnez vos projets et réalisations concrètes</li>
                <li>• Un CV bien structuré améliore votre score</li>
                <li>• Passez rapidement vos tests techniques</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
