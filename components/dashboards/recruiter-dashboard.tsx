'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/ui/page-header';
import { Briefcase, Plus, Edit, Trash2, Loader2, Users, TrendingUp, Eye, Building, MapPin, Calendar, DollarSign, Star } from 'lucide-react';

type JobOffer = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  type: string;
  createdAt: string;
  company: { name: string };
  _count: { applications: number };
};

export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    type: 'FULL_TIME'
  });

  useEffect(() => {
    fetchJobOffers();
  }, []);

  const fetchJobOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/job-offers');
      if (response.ok) {
        const data = await response.json();
        setJobOffers(Array.isArray(data) ? data : []);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les offres", variant: "destructive" });
        setJobOffers([]);
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
      setJobOffers([]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: "Erreur", description: "Titre et description requis", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingOffer ? `/api/job-offers/${editingOffer.id}` : '/api/job-offers';
      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ 
          title: "Succès", 
          description: editingOffer ? "Offre mise à jour avec succès" : "Offre créée avec succès" 
        });
        resetForm();
        fetchJobOffers();
      } else {
        const error = await response.text();
        toast({ title: "Erreur", description: error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;

    try {
      const response = await fetch(`/api/job-offers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Succès", description: "Offre supprimée avec succès" });
        fetchJobOffers();
      } else {
        const error = await response.text();
        toast({ title: "Erreur", description: error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    }
  };

  const startEdit = (offer: JobOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      requirements: offer.requirements,
      location: offer.location,
      salary: offer.salary,
      type: offer.type
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      salary: '',
      type: 'FULL_TIME'
    });
    setEditingOffer(null);
    setShowCreateDialog(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_TIME': return 'Temps plein';
      case 'PART_TIME': return 'Temps partiel';
      case 'CONTRACT': return 'Contrat';
      case 'INTERNSHIP': return 'Stage';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FULL_TIME': return 'bg-green-100 text-green-800';
      case 'PART_TIME': return 'bg-blue-100 text-blue-800';
      case 'CONTRACT': return 'bg-purple-100 text-purple-800';
      case 'INTERNSHIP': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex h-96 justify-center items-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Chargement de vos offres d'emploi...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title={`Dashboard Recruteur - ${session?.user?.name}`}
          description="Gérez vos offres d'emploi et suivez les candidatures"
        />

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Offres actives</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{jobOffers.length}</div>
              <p className="text-xs text-blue-700">offres publiées</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Candidatures</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {jobOffers.reduce((total, offer) => total + offer._count.applications, 0)}
              </div>
              <p className="text-xs text-green-700">candidatures reçues</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Taux moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {jobOffers.length > 0 
                  ? Math.round(jobOffers.reduce((total, offer) => total + offer._count.applications, 0) / jobOffers.length)
                  : 0
                }
              </div>
              <p className="text-xs text-purple-700">candidatures par offre</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions principales */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Mes offres d'emploi</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle offre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOffer ? 'Modifier l\'offre d\'emploi' : 'Créer une nouvelle offre d\'emploi'}
                </DialogTitle>
                <DialogDescription>
                  {editingOffer ? 'Modifiez les détails de votre offre d\'emploi' : 'Remplissez les détails de votre nouvelle offre d\'emploi'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Titre du poste *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Développeur Full Stack Senior"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type de contrat</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Temps plein</SelectItem>
                        <SelectItem value="PART_TIME">Temps partiel</SelectItem>
                        <SelectItem value="CONTRACT">Contrat</SelectItem>
                        <SelectItem value="INTERNSHIP">Stage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Paris, France"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Salaire</Label>
                    <Input
                      id="salary"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="Ex: 45-55k€"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description du poste *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le poste, les responsabilités, l'environnement de travail..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="requirements">Compétences requises</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Listez les compétences techniques et soft skills requises..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingOffer ? 'Modification...' : 'Création...'}
                      </>
                    ) : (
                      <>
                        {editingOffer ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingOffer ? 'Modifier' : 'Créer'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des offres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Vos offres d'emploi
            </CardTitle>
            <CardDescription>
              Gérez toutes vos offres d'emploi et consultez les candidatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobOffers.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune offre d'emploi</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première offre d'emploi pour commencer à recevoir des candidatures.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer ma première offre
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Offre d'emploi</TableHead>
                      <TableHead className="font-semibold text-center">Type</TableHead>
                      <TableHead className="font-semibold text-center">Candidatures</TableHead>
                      <TableHead className="font-semibold text-center">Créée le</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobOffers.map(offer => (
                      <TableRow key={offer.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{offer.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {offer.company.name}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {offer.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {offer.location}
                                </div>
                              )}
                              {offer.salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {offer.salary}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getTypeColor(offer.type)}>
                            {getTypeLabel(offer.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="outline" className="font-semibold">
                              {offer._count.applications}
                            </Badge>
                            {offer._count.applications > 0 && (
                              <Star className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/job-offers/${offer.id}/applications`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(offer)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(offer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
