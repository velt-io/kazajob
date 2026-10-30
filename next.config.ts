import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-XSS-Protection',            value: '1; mode=block' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Ancienne URL de la vue recruteur (avant /entreprise)
      {
        source: '/',
        has: [{ type: 'query', key: 'view', value: 'entreprise' }],
        destination: '/entreprise',
        permanent: true,
      },
      // URLs en français : anciennes adresses (liens d'emails, favoris, Google) → nouvelles
      { source: '/admin/ai', destination: '/admin/ia', permanent: true },
      { source: '/admin/analytics', destination: '/admin/statistiques', permanent: true },
      { source: '/admin/backup', destination: '/admin/sauvegardes', permanent: true },
      { source: '/admin/bug-reports', destination: '/admin/signalements', permanent: true },
      { source: '/admin/companies', destination: '/admin/entreprises', permanent: true },
      { source: '/admin/companies/:id', destination: '/admin/entreprises/:id', permanent: true },
      { source: '/admin/dashboard', destination: '/admin/tableau-de-bord', permanent: true },
      { source: '/admin/demo', destination: '/admin/demos', permanent: true },
      { source: '/admin/events', destination: '/admin/evenements', permanent: true },
      { source: '/admin/jobs', destination: '/admin/offres', permanent: true },
      { source: '/admin/jobs/new', destination: '/admin/offres/nouvelle', permanent: true },
      { source: '/admin/launch', destination: '/admin/lancement', permanent: true },
      { source: '/admin/plans', destination: '/admin/forfaits', permanent: true },
      { source: '/admin/promos', destination: '/admin/codes-promo', permanent: true },
      { source: '/admin/settings', destination: '/admin/parametres', permanent: true },
      { source: '/admin/settings/tracking', destination: '/admin/parametres/suivi', permanent: true },
      { source: '/admin/skills', destination: '/admin/competences', permanent: true },
      { source: '/admin/subscriptions', destination: '/admin/abonnements', permanent: true },
      { source: '/admin/traffic', destination: '/admin/trafic', permanent: true },
      { source: '/admin/trainings', destination: '/admin/formations', permanent: true },
      { source: '/admin/trainings/new', destination: '/admin/formations/nouvelle', permanent: true },
      { source: '/admin/users', destination: '/admin/utilisateurs', permanent: true },
      { source: '/auth/login', destination: '/connexion', permanent: true },
      { source: '/auth/post-oauth', destination: '/connexion/oauth', permanent: true },
      { source: '/auth/register', destination: '/inscription', permanent: true },
      { source: '/auth/forgot-password', destination: '/mot-de-passe-oublie', permanent: true },
      { source: '/auth/reset-password', destination: '/nouveau-mot-de-passe', permanent: true },
      { source: '/auth/email-verified', destination: '/email-confirme', permanent: true },
      { source: '/candidate', destination: '/candidat', permanent: true },
      { source: '/candidate/agenda', destination: '/candidat/entretiens', permanent: true },
      { source: '/candidate/applications', destination: '/candidat/candidatures', permanent: true },
      { source: '/candidate/dashboard', destination: '/candidat/tableau-de-bord', permanent: true },
      { source: '/candidate/events', destination: '/candidat/evenements', permanent: true },
      { source: '/candidate/favorites', destination: '/candidat/favoris', permanent: true },
      { source: '/candidate/jobs', destination: '/candidat/offres', permanent: true },
      { source: '/candidate/jobs/:id', destination: '/candidat/offres/:id', permanent: true },
      { source: '/candidate/profile', destination: '/candidat/profil', permanent: true },
      { source: '/candidate/referral', destination: '/candidat/parrainage', permanent: true },
      { source: '/candidate/settings', destination: '/candidat/parametres', permanent: true },
      { source: '/candidate/training', destination: '/candidat/formations', permanent: true },
      { source: '/candidate/training/:id', destination: '/candidat/formations/:id', permanent: true },
      { source: '/recruiter', destination: '/recruteur', permanent: true },
      { source: '/recruiter/agenda', destination: '/recruteur/entretiens', permanent: true },
      { source: '/recruiter/analytics', destination: '/recruteur/statistiques', permanent: true },
      { source: '/recruiter/applications', destination: '/recruteur/candidatures', permanent: true },
      { source: '/recruiter/candidates', destination: '/recruteur/candidats', permanent: true },
      { source: '/recruiter/candidates/:id', destination: '/recruteur/candidats/:id', permanent: true },
      { source: '/recruiter/company', destination: '/recruteur/entreprise', permanent: true },
      { source: '/recruiter/company/team', destination: '/recruteur/entreprise/equipe', permanent: true },
      { source: '/recruiter/company-setup', destination: '/recruteur/creation-entreprise', permanent: true },
      { source: '/recruiter/dashboard', destination: '/recruteur/tableau-de-bord', permanent: true },
      { source: '/recruiter/events', destination: '/recruteur/evenements', permanent: true },
      { source: '/recruiter/jobs', destination: '/recruteur/offres', permanent: true },
      { source: '/recruiter/jobs/new', destination: '/recruteur/offres/nouvelle', permanent: true },
      { source: '/recruiter/jobs/:id', destination: '/recruteur/offres/:id', permanent: true },
      { source: '/recruiter/jobs/:id/edit', destination: '/recruteur/offres/:id/modifier', permanent: true },
      { source: '/recruiter/join', destination: '/recruteur/rejoindre', permanent: true },
      { source: '/recruiter/profile', destination: '/recruteur/profil', permanent: true },
      { source: '/recruiter/stages/new', destination: '/recruteur/stages/nouveau', permanent: true },
      { source: '/recruiter/talent-pool', destination: '/recruteur/vivier', permanent: true },
      { source: '/recruiter/training', destination: '/recruteur/formations', permanent: true },
      { source: '/recruiter/training/new', destination: '/recruteur/formations/nouvelle', permanent: true },
      { source: '/onboarding', destination: '/premiers-pas', permanent: true },
      { source: '/onboarding/cv-builder', destination: '/premiers-pas/cv', permanent: true },
      { source: '/pricing', destination: '/tarifs', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
