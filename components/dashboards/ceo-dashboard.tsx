'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Building2, Users, Briefcase, FileText, TrendingUp, Plus, Edit, Trash2, CheckCircle, Clock, XCircle, BarChart3, Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  location: string;
  recruitersCount: number;
  jobOffersCount: number;
  createdAt: string;
}

interface Recruiter {
  id: string;
  name: string;
  email: string;
  company: string;
  companyId?: string;
  jobOffersCount: number;
  createdAt: string;
}

interface Stats {
  totalCompanies: number;
  totalRecruiters: number;
  totalJobOffers: number;
  totalApplications: number;
  acceptedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  successRate: number;
}

interface OverviewData {
  stats: Stats;
  recentCompanies: Company[];
  topRecruiters: Recruiter[];
}

export default function CeoDashboard() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [submitting, setSubmitting] = useState(false);

  // États pour les formulaires
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isRecruiterDialogOpen, setIsRecruiterDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);

  // Charger les données
  useEffect(() => {
    loadOverviewData();
    if (activeTab === 'companies') {
      loadCompanies();
    } else if (activeTab === 'recruiters') {
      loadRecruiters();
    }
  }, [activeTab]);

  const loadOverviewData = async () => {
    try {
      const response = await fetch('/api/ceo/overview');
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/ceo/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.map((company: any) => ({
          id: company.id,
          name: company.name,
          description: company.description || '',
          location: company.location || '',
          recruitersCount: company._count.users,
          jobOffersCount: company._count.jobOffers,
          createdAt: company.createdAt
        })));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
    }
  };

  const loadRecruiters = async () => {
    try {
      const response = await fetch('/api/ceo/recruiters');
      if (response.ok) {
        const data = await response.json();
        setRecruiters(data.map((recruiter: any) => ({
          id: recruiter.id,
          name: recruiter.name || '',
          email: recruiter.email,
          company: recruiter.company?.name || 'Aucune entreprise',
          companyId: recruiter.company?.id,
          jobOffersCount: recruiter._count.createdOffers,
          createdAt: recruiter.createdAt
        })));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recruteurs:', error);
    }
  };

  const handleCreateCompany = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/ceo/companies', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Entreprise créée avec succès' });
        setIsCompanyDialogOpen(false);
        loadCompanies();
        loadOverviewData();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRecruiter = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/ceo/recruiters', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Recruteur créé avec succès' });
        setIsRecruiterDialogOpen(false);
        loadRecruiters();
        loadOverviewData();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;

    try {
      const response = await fetch(`/api/ceo/companies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Entreprise supprimée avec succès' });
        loadCompanies();
        loadOverviewData();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  const handleDeleteRecruiter = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce recruteur ?')) return;

    try {
      const response = await fetch(`/api/ceo/recruiters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Recruteur supprimé avec succès' });
        loadRecruiters();
        loadOverviewData();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Directeur</h1>
        <p className="text-muted-foreground">Gérez votre plateforme de recrutement</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="companies">Entreprises</TabsTrigger>
          <TabsTrigger value="recruiters">Recruteurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Entreprises</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{overviewData?.stats.totalCompanies || 0}</div>
                <p className="text-xs text-blue-700">Total des entreprises</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">Recruteurs</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{overviewData?.stats.totalRecruiters || 0}</div>
                <p className="text-xs text-green-700">Recruteurs actifs</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900">Offres d'emploi</CardTitle>
                <Briefcase className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{overviewData?.stats.totalJobOffers || 0}</div>
                <p className="text-xs text-purple-700">Postes disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-900">Candidatures</CardTitle>
                <FileText className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{overviewData?.stats.totalApplications || 0}</div>
                <p className="text-xs text-orange-700">Total des candidatures</p>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{overviewData?.stats.acceptedApplications || 0}</div>
                <p className="text-xs text-muted-foreground">Candidatures acceptées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{overviewData?.stats.pendingApplications || 0}</div>
                <p className="text-xs text-muted-foreground">En cours de traitement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overviewData?.stats.rejectedApplications || 0}</div>
                <p className="text-xs text-muted-foreground">Candidatures rejetées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overviewData?.stats.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Candidatures acceptées</p>
              </CardContent>
            </Card>
          </div>

          {/* Entreprises récentes et top recruteurs */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Entreprises récentes</CardTitle>
                <CardDescription>Les dernières entreprises ajoutées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overviewData?.recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{company.recruitersCount} recruteurs</p>
                        <p className="text-sm text-muted-foreground">{company.jobOffersCount} offres</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top recruteurs</CardTitle>
                <CardDescription>Recruteurs les plus actifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overviewData?.topRecruiters.map((recruiter) => (
                    <div key={recruiter.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{recruiter.name}</p>
                        <p className="text-sm text-muted-foreground">{recruiter.company}</p>
                      </div>
                      <Badge variant="secondary">
                        {recruiter.jobOffersCount} offres
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestion des Entreprises</h2>
            <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une entreprise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle entreprise à la plateforme
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreateCompany}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nom de l'entreprise</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Localisation</Label>
                      <Input id="location" name="location" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="website">Site web</Label>
                      <Input id="website" name="website" type="url" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer l\'entreprise'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Recruteurs</TableHead>
                    <TableHead>Offres</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.description}</TableCell>
                      <TableCell>{company.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{company.recruitersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.jobOffersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruiters" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestion des Recruteurs</h2>
            <Dialog open={isRecruiterDialogOpen} onOpenChange={setIsRecruiterDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un recruteur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau recruteur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau recruteur à la plateforme
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreateRecruiter}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="companyId">Entreprise</Label>
                      <Select name="companyId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une entreprise" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRecruiterDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer le recruteur'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Offres créées</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters.map((recruiter) => (
                    <TableRow key={recruiter.id}>
                      <TableCell className="font-medium">{recruiter.name}</TableCell>
                      <TableCell>{recruiter.email}</TableCell>
                      <TableCell>{recruiter.company}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{recruiter.jobOffersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteRecruiter(recruiter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
