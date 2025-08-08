'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, CheckCircle, XCircle, ClipboardEdit } from 'lucide-react';
import type { MockUser } from "@/app/lib/session";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  score: number;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "TEST_PENDING": return { text: "Test à passer", variant: "default", icon: <ClipboardEdit className="h-4 w-4" /> };
    case "CV_REJECTED": return { text: "CV Rejeté", variant: "destructive", icon: <XCircle className="h-4 w-4" /> };
    case "TEST_COMPLETED": return { text: "Test terminé", variant: "secondary", icon: <CheckCircle className="h-4 w-4" /> };
    default: return { text: "En attente", variant: "secondary", icon: <FileText className="h-4 w-4" /> };
  }
}

export default function CandidateDashboard({ user }: { user: MockUser }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
    fetchCvStatus();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
    }
  };

  const fetchCvStatus = async () => {
    try {
      const response = await fetch('/api/candidate/cv');
      if (response.ok) {
        const data = await response.json();
        setCvUrl(data.cvUrl);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du CV:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        setCvFile(file);
      } else {
        toast({
          title: "Type de fichier non supporté",
          description: "Veuillez sélectionner un fichier PDF ou TXT.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadCv = async () => {
    if (!cvFile) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier CV.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
      const response = await fetch('/api/candidate/cv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCvUrl(data.cvUrl);
        setCvFile(null);
        toast({
          title: "CV uploadé avec succès",
          description: "Votre CV a été sauvegardé et sera analysé lors de vos candidatures.",
        });
        
        // Recharger les candidatures pour voir les nouveaux scores
        fetchApplications();
      } else {
        const error = await response.text();
        toast({
          title: "Erreur lors de l'upload",
          description: error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload du CV.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Upload CV */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Mon CV
          </CardTitle>
          <CardDescription>
            Uploadez votre CV pour postuler aux offres d'emploi. Il sera analysé automatiquement par notre IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cvUrl ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">CV uploadé avec succès</p>
                  <p className="text-sm text-green-600">Votre CV est prêt pour les candidatures</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                  Voir le CV
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv-upload">Sélectionner votre CV (PDF ou TXT)</Label>
                <Input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="h-11"
                />
              </div>
              
              {cvFile && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{cvFile.name}</span>
                  </div>
                  <Button 
                    onClick={handleUploadCv} 
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? 'Upload...' : 'Uploader'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Candidatures */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Mes Candidatures</CardTitle>
          <CardDescription>
            Suivez l'avancement de toutes vos candidatures ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune candidature pour le moment</p>
              <p className="text-sm text-gray-400 mt-2">
                Consultez les offres d'emploi pour postuler
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {applications.map((app) => {
                const statusInfo = getStatusInfo(app.status);
                return (
                  <li key={app.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-bold text-lg">{app.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={statusInfo.variant as any} className="flex items-center gap-2 py-1 px-3">
                        {statusInfo.icon}
                        <span>{statusInfo.text} (Score: {app.score}%)</span>
                      </Badge>
                      {app.status === "TEST_PENDING" && (
                        <Button size="sm">Passer le test</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
