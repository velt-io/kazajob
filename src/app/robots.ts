import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/candidat/offres', '/candidat/offres/', '/candidat/formations', '/candidat/formations/'],
        disallow: [
          '/candidat/tableau-de-bord',
          '/candidat/candidatures',
          '/candidat/messages',
          '/candidat/profil',
          '/candidat/parametres',
          '/candidat/entretiens',
          '/candidat/ia',
          '/recruteur/',
          '/admin/',
          '/premiers-pas/',
          '/api/',
          '/connexion',
          '/inscription',
          '/mot-de-passe-oublie',
          '/nouveau-mot-de-passe',
          '/email-confirme',
        ],
      },
      // Autorise Googlebot à indexer les offres + formations publiques
      {
        userAgent: 'Googlebot',
        allow: ['/', '/candidat/offres', '/candidat/offres/', '/candidat/formations', '/candidat/formations/'],
      },
    ],
    sitemap: 'https://kazajob.re/sitemap.xml',
    host: 'https://kazajob.re',
  }
}
