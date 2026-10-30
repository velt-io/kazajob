/**
 * KAZAJOB QUEST — Parcours d'aventure du candidat (logique pure, testable).
 *
 * La recherche d'emploi devient une quête en 9 chapitres, de la plage de
 * l'Hermitage jusqu'au sommet du Piton de la Fournaise. Chaque chapitre est
 * validé par une donnée réelle du compte (aucun faux progrès).
 * Les récompenses d'XP réelles restent gérées par le serveur (cf. gamification).
 */

export type ChapterStatus = 'done' | 'current' | 'open'
export type Rarity = 'commune' | 'rare' | 'epique' | 'legendaire'

export interface JourneyInput {
  hasAvatar: boolean
  profileFields: number      // nb de champs clés renseignés (localisation, bio, téléphone)
  skills: number
  hasCv: boolean
  favorites: number
  applications: number
  interviews: number         // candidatures au stade entretien, offre ou embauche
  hired: number
}

export interface Chapter {
  id: string
  index: number              // 1…9 (chiffre romain affiché)
  title: string
  place: string              // lieu de l'île
  objective: string
  lore: string
  href: string
  cta: string
  xp: number
  rarity: Rarity
  progress: number           // 0–100
  status: ChapterStatus
}

type Def = Omit<Chapter, 'progress' | 'status' | 'index'> & { measure: (i: JourneyInput) => number }

const pct = (v: number, goal: number) => Math.max(0, Math.min(100, Math.round((v / goal) * 100)))

export const CHAPTERS: Def[] = [
  { id: 'eveil', title: "L'Éveil du héros", place: "Plage de l'Hermitage", rarity: 'commune', xp: 50,
    objective: 'Crée ton avatar', lore: 'Tout héros commence par un visage. Le tien te représentera auprès des recruteurs, sans photo ni a priori.',
    href: '/candidat/profil', cta: 'Créer mon avatar', measure: (i) => (i.hasAvatar ? 100 : 0) },
  { id: 'grimoire', title: 'Le Grimoire', place: 'Cirque de Salazie', rarity: 'commune', xp: 50,
    objective: 'Renseigne ta ville, ta bio et ton téléphone', lore: 'Ton grimoire raconte qui tu es. Un profil complet est vu bien plus souvent.',
    href: '/candidat/profil', cta: 'Compléter mon profil', measure: (i) => pct(i.profileFields, 3) },
  { id: 'forge', title: 'La Forge des talents', place: 'Cirque de Cilaos', rarity: 'rare', xp: 40,
    objective: 'Ajoute au moins 3 compétences', lore: 'Forge tes compétences : ce sont elles qui déclenchent les matchs avec les offres.',
    href: '/candidat/profil', cta: 'Ajouter des compétences', measure: (i) => pct(i.skills, 3) },
  { id: 'parchemin', title: 'Le Parchemin sacré', place: 'Cirque de Mafate', rarity: 'rare', xp: 50,
    objective: 'Crée ou importe ton CV', lore: 'Un parchemin clair et soigné ouvre bien des portes. Le créateur de CV t’aide à l’écrire.',
    href: '/premiers-pas/cv', cta: 'Écrire mon CV', measure: (i) => (i.hasCv ? 100 : 0) },
  { id: 'exploration', title: "Exploration de l'île", place: 'Saint-Denis', rarity: 'commune', xp: 20,
    objective: 'Sauvegarde une offre en favori', lore: 'Parcours les offres de toute l’île et marque celles qui t’attirent.',
    href: '/candidat/offres', cta: 'Explorer les offres', measure: (i) => pct(i.favorites, 1) },
  { id: 'premier-sort', title: 'Premier sort', place: 'Le Port', rarity: 'rare', xp: 30,
    objective: 'Envoie ta première candidature', lore: 'Ton premier sort : une candidature envoyée en un geste, lettre suggérée par KazaIA.',
    href: '/candidat/offres', cta: 'Postuler à une offre', measure: (i) => pct(i.applications, 1) },
  { id: 'guilde', title: 'Rejoindre la guilde', place: 'Saint-Pierre', rarity: 'epique', xp: 75,
    objective: 'Postule à 3 offres', lore: 'Les héros persévérants multiplient leurs chances. Trois candidatures, et la guilde te remarque.',
    href: '/candidat/offres', cta: 'Continuer à postuler', measure: (i) => pct(i.applications, 3) },
  { id: 'epreuve', title: "L'Épreuve", place: 'Grand Brûlé', rarity: 'epique', xp: 100,
    objective: 'Décroche un entretien', lore: 'Le recruteur t’attend. Prépare-toi avec KazaIA : questions, conseils, simulation.',
    href: '/candidat/entretiens', cta: 'Préparer mon entretien', measure: (i) => pct(i.interviews, 1) },
  { id: 'tresor', title: 'Le Trésor du Piton', place: 'Piton de la Fournaise', rarity: 'legendaire', xp: 250,
    objective: 'Sois embauché·e', lore: 'Au sommet du volcan, le trésor : ton nouveau job. La légende de ton aventure est écrite.',
    href: '/candidat/candidatures', cta: 'Suivre mes candidatures', measure: (i) => pct(i.hired, 1) },
]

/** Calcule l'état de chaque chapitre. Le premier chapitre non terminé devient la quête principale. */
export function computeJourney(input: JourneyInput): Chapter[] {
  let currentAssigned = false
  return CHAPTERS.map(({ measure, ...def }, i) => {
    const progress = measure(input)
    let status: ChapterStatus = progress >= 100 ? 'done' : 'open'
    if (status === 'open' && !currentAssigned) { status = 'current'; currentAssigned = true }
    return { ...def, index: i + 1, progress, status }
  })
}

export function journeySummary(chapters: Chapter[]) {
  const done = chapters.filter((c) => c.status === 'done')
  return {
    done: done.length,
    total: chapters.length,
    xpEarned: done.reduce((s, c) => s + c.xp, 0),
    xpTotal: chapters.reduce((s, c) => s + c.xp, 0),
    current: chapters.find((c) => c.status === 'current') ?? null,
  }
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string }> = {
  commune:    { label: 'Commune',    color: '#A3A3B8', glow: 'rgba(163,163,184,0.5)' },
  rare:       { label: 'Rare',       color: '#22D3EE', glow: 'rgba(34,211,238,0.6)' },
  epique:     { label: 'Épique',     color: '#C084FC', glow: 'rgba(192,132,252,0.7)' },
  legendaire: { label: 'Légendaire', color: '#FACC15', glow: 'rgba(250,204,21,0.75)' },
}

/** Parcours d'exemple pour la vitrine (page d'accueil) : 4 chapitres terminés. */
export const DEMO_JOURNEY_INPUT: JourneyInput = {
  hasAvatar: true, profileFields: 3, skills: 4, hasCv: true, favorites: 0, applications: 0, interviews: 0, hired: 0,
}
