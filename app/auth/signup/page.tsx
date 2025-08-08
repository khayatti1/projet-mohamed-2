'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Container } from '@/components/layout/container';
import { Loader2, User, Building, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleParam || '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.role === 'CEO' && !formData.companyName.trim()) {
      setError('Le nom de l\'entreprise est requis pour les CEO');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          companyName: formData.companyName
        }),
      });

      if (response.ok) {
        router.push('/auth/signin?message=Compte créé avec succès');
      } else {
        const data = await response.text();
        setError(data || 'Erreur lors de la création du compte');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }

    setLoading(false);
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'CANDIDATE':
        return {
          icon: <User className="w-5 h-5" />,
          title: 'Candidat',
          description: 'Recherchez et postulez à des offres d\'emploi',
          color: 'text-blue-600'
        };
      case 'RECRUITER':
        return {
          icon: <Briefcase className="w-5 h-5" />,
          title: 'Recruteur',
          description: 'Publiez des offres et gérez les candidatures',
          color: 'text-green-600'
        };
      case 'CEO':
        return {
          icon: <Building className="w-5 h-5" />,
          title: 'CEO',
          description: 'Gérez votre entreprise et vos équipes',
          color: 'text-purple-600'
        };
      default:
        return null;
    }
  };

  const selectedRoleInfo = getRoleInfo(formData.role);

  return (
    <Container>
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Créer un compte
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Rejoignez notre plateforme de recrutement intelligent
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nom complet
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Rôle
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value, companyName: '' })}
                      required
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Sélectionnez votre rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CANDIDATE">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>Candidat</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="RECRUITER">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-green-600" />
                            <span>Recruteur</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="CEO">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-600" />
                            <span>CEO</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedRoleInfo && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={selectedRoleInfo.color}>{selectedRoleInfo.icon}</span>
                          <span className="font-medium text-gray-900">{selectedRoleInfo.title}</span>
                        </div>
                        <p className="text-sm text-gray-600">{selectedRoleInfo.description}</p>
                        {formData.role === 'RECRUITER' && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                            <p className="text-xs text-blue-700">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Vous serez affecté à une entreprise par un CEO après inscription
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {formData.role === 'CEO' && (
                    <div>
                      <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                        Nom de l'entreprise
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Confirmez votre mot de passe"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    'Créer mon compte'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
