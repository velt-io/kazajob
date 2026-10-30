'use client'

import { KZ } from '@/lib/constants'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/radix'

const FAQ_ITEMS = [
  {
    q: 'Kazajob est-il vraiment gratuit pour les candidats ?',
    a: 'Oui, à 100%. Toutes les fonctionnalités candidat — offres illimitées, KazaIA, CV Builder, messagerie, gamification — sont gratuites et le resteront. Kazajob ne facturera jamais les candidats. Notre modèle économique repose uniquement sur les abonnements recruteurs.',
  },
  {
    q: 'Comment fonctionne le matching IA ?',
    a: 'Notre algorithme analyse ton profil (compétences, localisation, secteur, expériences) et le compare aux offres disponibles. Tu reçois un score de correspondance de 0 à 100% pour chaque offre. Plus ton profil est complet, plus le matching est précis. KazaIA peut aussi analyser ton CV pour extraire automatiquement tes compétences.',
  },
  {
    q: 'Quelles sont les offres disponibles sur Kazajob ?',
    a: 'Kazajob se concentre sur l\'emploi à La Réunion (974). Toutes les offres sont publiées par des recruteurs locaux vérifiés. Tu trouveras des CDI, CDD, stages, alternances et missions freelance dans tous les secteurs — du BTP à la tech en passant par le tourisme, la santé et le commerce.',
  },
  {
    q: 'Comment KazaIA génère-t-il les lettres de motivation ?',
    a: 'KazaIA analyse ton profil complet (compétences, bio, expériences) et les détails de l\'offre pour rédiger une lettre personnalisée et professionnelle. Tu peux choisir le ton — professionnel, original ou concis — et modifier le résultat à ta convenance avant de l\'envoyer. Propulsé par Groq (modèle open source GPT-OSS d\'OpenAI) aujourd\'hui, Claude demain.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Kazajob s\'appuie sur une infrastructure PostgreSQL hébergée en Europe, avec chiffrement des données au repos et en transit. Ton CV est stocké dans un espace privé sécurisé. Nous sommes RGPD conformes et ne revendons jamais tes données. Tu peux demander la suppression de ton compte à tout moment.',
  },
  {
    q: 'Qu\'est-ce que l\'offre de lancement pour les recruteurs ?',
    a: 'De temps à autre, Kazajob ouvre une campagne de lancement : un accès gratuit temporaire pour publier vos premières offres, sans carte bancaire et sans aucun prélèvement automatique. Sa durée et ses limites sont précisées au moment de l\'inscription. À l\'issue de la période gratuite, vous choisissez un forfait payant pour continuer à publier — vos candidatures et vos données restent accessibles. Cette offre est utilisable une seule fois par entreprise et sa disponibilité pour les nouvelles inscriptions est laissée à la discrétion de Kazajob.',
  },
  {
    q: 'En tant que recruteur, puis-je tester avant de payer ?',
    a: 'Oui, de deux façons. Si une campagne de lancement est ouverte, vous pouvez publier gratuitement pendant sa durée, sans carte bancaire. Sinon, tous les forfaits payants incluent un essai de 30 jours : vous enregistrez votre carte à l\'activation (paiement sécurisé Stripe), mais aucun débit n\'a lieu pendant l\'essai — le 1er prélèvement intervient à la fin des 30 jours, sauf résiliation avant. Sans engagement, annulable à tout moment.',
  },
  {
    q: 'Quelle est la différence avec les autres sites d\'emploi ?',
    a: 'Kazajob est la seule plateforme locale à combiner : matching IA personnalisé, KazaIA pour la rédaction et la préparation, CV Builder visuel, gamification, et une expérience mobile-first. Là où les autres affichent des offres, Kazajob t\'accompagne tout au long de ta recherche.',
  },
  {
    q: 'À quoi ressemble la roadmap de Kazajob ?',
    a: 'Dans les 3 prochains mois : analytics recruteur avancés, CVthèque et alertes push. D\'ici 6 mois : accompagnement recrutement & partenariats locaux, baromètre des salaires 974, intégration ATS et application mobile native.',
  },
]

// Données structurées FAQPage → éligibilité rich snippets Google
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export function FaqSection() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <section id="faq" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.violet }}>FAQ</p>
          <h2 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[var(--kz-ink)]">
            Les questions qu&apos;on nous pose<br />
            <span style={{ color: KZ.violet }}>le plus souvent.</span>
          </h2>
        </div>

        {/* Accordéon Radix : clavier, ARIA et animation d'ouverture */}
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-center text-sm text-[var(--kz-mute)] mt-8">
          Tu as une autre question ?{' '}
          <a href="mailto:hello@kazajob.re" className="font-bold hover:text-[var(--kz-orange)] transition-colors" style={{ color: KZ.orange }}>
            Écris-nous — hello@kazajob.re
          </a>
        </p>
      </div>
      </section>
    </>
  )
}
