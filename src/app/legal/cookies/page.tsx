import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Utilisation des cookies sur Kazajob.',
}

export default function Page() {
  return (
    <LegalDoc title="Politique de cookies" updated="10 juillet 2026"
      intro="Kazajob distingue les cookies strictement nécessaires au fonctionnement du service des cookies soumis à votre consentement."
      sections={[
        { h: 'Qu\'est-ce qu\'un cookie ?', body: ['Un cookie est un petit fichier déposé sur votre appareil par un site web, permettant notamment de maintenir votre session.'] },
        { h: 'Cookies nécessaires', body: ['Cookie de session d\'authentification (pour rester connecté) et préférences techniques. Ces cookies sont strictement nécessaires et ne requièrent pas de consentement préalable.'] },
        { h: 'Cookies de mesure d\'audience et publicitaires', body: ['Selon les intégrations actives configurées par l\'éditeur, Kazajob peut utiliser des outils de mesure d\'audience et des pixels publicitaires tiers (ex. réseaux sociaux). Ces cookies ne se déclenchent qu\'après votre consentement explicite, recueilli via le bandeau de consentement, et vous pouvez le retirer à tout moment.'] },
        { h: 'Gestion des cookies', body: ['Vous pouvez personnaliser vos préférences à tout moment via le bandeau de consentement, ou configurer votre navigateur pour bloquer ou supprimer les cookies. La suppression du cookie de session entraînera votre déconnexion.'] },
      ]} />
  )
}
