import Link from 'next/link'
import { Container } from './container'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-8">
      <Container>
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Smart Interview</h3>
              <p className="text-sm text-gray-600">
                Plateforme intelligente de recrutement avec analyse IA des CV et tests techniques automatisés.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Plateforme</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/jobs" className="hover:text-gray-900">Offres d'emploi</Link></li>
                <li><Link href="/auth/signup" className="hover:text-gray-900">Créer un compte</Link></li>
                <li><Link href="/auth/signin" className="hover:text-gray-900">Se connecter</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Rôles</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="hover:text-gray-900">Directeur</span></li>
                <li><span className="hover:text-gray-900">Recruteur</span></li>
                <li><span className="hover:text-gray-900">Candidat</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="hover:text-gray-900">Documentation</span></li>
                <li><span className="hover:text-gray-900">Contact</span></li>
                <li><span className="hover:text-gray-900">FAQ</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 Smart Interview Platform. Tous droits réservés.</p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
