/**
 * KAZAJOB — Données de DÉMO pour une base de test (entreprises, offres, candidats,
 * candidatures, entretiens, conversations). Toutes les adresses se terminent par
 * @demo.kazajob.test ; relancer le script remplace les données de démo précédentes.
 *
 * Lancement (base de TEST uniquement, après db:seed) :
 *   DEMO_PASSWORD=... npm run db:seed:demo -- --confirm-demo
 *
 * Garde-fous :
 *  - sans --confirm-demo, rien n'est écrit ;
 *  - refus si la base contient plus de 5 comptes réels (non démo, non admin) :
 *    on ne remplit jamais une base de production par erreur ;
 *  - aucun mot de passe en dur : DEMO_PASSWORD est obligatoire.
 */
import bcrypt from 'bcryptjs'
import { and, inArray, like, ne, notLike, sql } from 'drizzle-orm'
import { db as defaultDb } from './index'
import {
  applications, candidateSkills, companies, companyMembers, companySubscriptions,
  conversations, interviews, jobSkills, jobs, messages, notifications, profiles, skills,
} from './schema'
import { buildCharacterConfig } from '../avatar'

const DOMAIN = '@demo.kazajob.test'
const DAY = 86_400_000
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY)

const COMPANIES = [
  { key: 'lagon',   name: 'Hôtel Lagon Bleu',     sector: 'Tourisme & Hôtellerie',   city: 'Saint-Gilles',  recruiter: 'Maëva Payet' },
  { key: 'btp',     name: 'Bâti Sud Construction', sector: 'BTP & Construction',      city: 'Saint-Pierre',  recruiter: 'Johan Grondin' },
  { key: 'clinique',name: 'Clinique des Flamboyants', sector: 'Santé & Social',      city: 'Saint-Denis',   recruiter: 'Nadia Hoarau' },
  { key: 'digital', name: 'Péi Digital',           sector: 'Informatique & Tech',     city: 'Saint-Denis',   recruiter: 'Kévin Técher' },
  { key: 'marche',  name: 'Marché Frais 974',      sector: 'Commerce & Vente',        city: 'Le Port',       recruiter: 'Sandrine Fontaine' },
] as const

type JobSeed = {
  company: typeof COMPANIES[number]['key']; title: string; type: string; city: string
  min: number | null; max: number | null; skills: string[]; status?: 'published' | 'draft' | 'paused' | 'expired'
  remote?: boolean; boosted?: boolean; ageDays?: number
}

const JOBS: JobSeed[] = [
  { company: 'lagon', title: 'Réceptionniste (H/F)', type: 'CDI', city: 'Saint-Gilles', min: 1850, max: 2100, skills: ['Accueil client', 'Anglais', 'Réservation'], boosted: true, ageDays: 1 },
  { company: 'lagon', title: 'Serveur / Serveuse en salle (H/F)', type: 'CDD', city: 'Saint-Gilles', min: 1750, max: 1900, skills: ['Service en salle', 'Accueil client'], ageDays: 4 },
  { company: 'lagon', title: 'Chef de partie (H/F)', type: 'CDI', city: 'Saint-Gilles', min: 2200, max: 2600, skills: ['Cuisine', 'Hygiène HACCP'], ageDays: 9 },
  { company: 'lagon', title: 'Animateur·rice touristique (H/F)', type: 'Saisonnier', city: 'Saint-Leu', min: 1700, max: 1850, skills: ['Animation', 'Anglais'], status: 'draft' },
  { company: 'btp', title: 'Chef de chantier (H/F)', type: 'CDI', city: 'Saint-Pierre', min: 2800, max: 3400, skills: ['Gestion de chantier', 'Lecture de plans'], ageDays: 2 },
  { company: 'btp', title: 'Maçon qualifié (H/F)', type: 'CDI', city: 'Le Tampon', min: 2000, max: 2300, skills: ['Maçonnerie', 'Coffrage'], ageDays: 12 },
  { company: 'btp', title: 'Conducteur d’engins (H/F)', type: 'CDD', city: 'Saint-Louis', min: 2100, max: 2400, skills: ['CACES', 'Terrassement'], status: 'paused' },
  { company: 'clinique', title: 'Infirmier·ère de bloc (H/F)', type: 'CDI', city: 'Saint-Denis', min: 2600, max: 3100, skills: ['Soins infirmiers', 'Bloc opératoire'], boosted: true, ageDays: 3 },
  { company: 'clinique', title: 'Aide-soignant·e de nuit (H/F)', type: 'CDI', city: 'Saint-Denis', min: 1900, max: 2200, skills: ['Soins d’hygiène', 'Travail de nuit'], ageDays: 6 },
  { company: 'clinique', title: 'Secrétaire médical·e (H/F)', type: 'CDD', city: 'Saint-Denis', min: 1800, max: 2000, skills: ['Accueil client', 'Bureautique'], status: 'expired', ageDays: 70 },
  { company: 'digital', title: 'Développeur·se Full-Stack React / Node (H/F)', type: 'CDI', city: 'Saint-Denis', min: 3000, max: 3800, skills: ['JavaScript', 'React', 'Node.js', 'SQL'], remote: true, ageDays: 2 },
  { company: 'digital', title: 'UX/UI Designer (H/F)', type: 'Freelance', city: 'Saint-Denis', min: null, max: null, skills: ['Figma', 'UI/UX'], remote: true, ageDays: 8 },
  { company: 'digital', title: 'Alternant·e Data Analyst (H/F)', type: 'Alternance', city: 'Sainte-Marie', min: 1100, max: 1300, skills: ['Python', 'SQL'], ageDays: 15 },
  { company: 'marche', title: 'Vendeur·se conseil (H/F)', type: 'CDI', city: 'Le Port', min: 1750, max: 1950, skills: ['Vente', 'Accueil client'], ageDays: 5 },
  { company: 'marche', title: 'Préparateur·rice de commandes (H/F)', type: 'Intérim', city: 'Le Port', min: 1750, max: 1800, skills: ['Logistique', 'CACES'], ageDays: 11 },
  { company: 'marche', title: 'Responsable de rayon (H/F)', type: 'CDI', city: 'Saint-Paul', min: 2300, max: 2700, skills: ['Management', 'Vente'], ageDays: 20 },
]

const CANDIDATES = [
  { name: 'Léa Rivière',      city: 'Saint-Paul',   domain: 'tourisme',    gender: 'femme', skills: ['Accueil client', 'Anglais', 'Réservation'], xp: 640, streak: 6 },
  { name: 'Yanis Boyer',      city: 'Saint-Pierre', domain: 'btp',         gender: 'homme', skills: ['Gestion de chantier', 'Lecture de plans', 'Maçonnerie'], xp: 410, streak: 3 },
  { name: 'Anaïs Técher',     city: 'Saint-Denis',  domain: 'sante',       gender: 'femme', skills: ['Soins infirmiers', 'Bloc opératoire'], xp: 920, streak: 12 },
  { name: 'Mathis Lauret',    city: 'Saint-Denis',  domain: 'tech',        gender: 'homme', skills: ['JavaScript', 'React', 'Node.js', 'Git'], xp: 1280, streak: 21 },
  { name: 'Chloé Maillot',    city: 'Le Port',      domain: 'commerce',    gender: 'femme', skills: ['Vente', 'Accueil client', 'Management'], xp: 300, streak: 2 },
  { name: 'Dylan Hoareau',    city: 'Le Tampon',    domain: 'btp',         gender: 'homme', skills: ['Maçonnerie', 'Coffrage'], xp: 150, streak: 1 },
  { name: 'Inès Damour',      city: 'Saint-Gilles', domain: 'restauration',gender: 'femme', skills: ['Service en salle', 'Cuisine'], xp: 520, streak: 5 },
  { name: 'Noah Barret',      city: 'Sainte-Marie', domain: 'tech',        gender: 'homme', skills: ['Python', 'SQL', 'Git'], xp: 700, streak: 8 },
  { name: 'Emma Clain',       city: 'Saint-Denis',  domain: 'tech',        gender: 'femme', skills: ['Figma', 'UI/UX', 'Photoshop'], xp: 860, streak: 10 },
  { name: 'Lucas Robert',     city: 'Saint-Louis',  domain: 'transport',   gender: 'homme', skills: ['CACES', 'Logistique', 'Terrassement'], xp: 240, streak: 0 },
  { name: 'Manon Grondin',    city: 'Saint-Denis',  domain: 'sante',       gender: 'femme', skills: ['Soins d’hygiène', 'Travail de nuit'], xp: 480, streak: 4 },
  { name: 'Enzo Fontaine',    city: 'Saint-Leu',    domain: 'tourisme',    gender: 'homme', skills: ['Animation', 'Anglais'], xp: 90, streak: 0 },
]

const BIO = (name: string, city: string) =>
  `${name.split(' ')[0]}, basé·e à ${city}. Motivé·e, ponctuel·le et prêt·e à m’investir dans une équipe locale.`

/** Remplit la base `db` (injectable pour les tests) avec les données de démo. */
export async function runDemoSeed(db: typeof defaultDb, password: string): Promise<void> {
  const [{ real }] = await db.select({ real: sql<number>`count(*)::int` }).from(profiles)
    .where(and(notLike(profiles.email, `%${DOMAIN}`), ne(profiles.role, 'admin')))
  if (real > 5) {
    throw new Error(`${real} comptes réels détectés : cette base ressemble à la production. Abandon.`)
  }

  const [{ plans }] = await db.select({ plans: sql<number>`count(*)::int` }).from(sql`subscription_plans`)
  if (!plans) throw new Error('Aucun forfait en base : lance d’abord npm run db:seed.')

  // Purge des données de démo précédentes (cascade sur entreprises, offres, candidatures…)
  const demoIds = (await db.select({ id: profiles.id }).from(profiles).where(like(profiles.email, `%${DOMAIN}`))).map((r) => r.id)
  if (demoIds.length) {
    await db.delete(companies).where(inArray(companies.ownerId, demoIds))
    await db.delete(profiles).where(inArray(profiles.id, demoIds))
  }
  console.log(`🗑️  Anciennes données de démo supprimées (${demoIds.length} comptes)`)

  const passwordHash = await bcrypt.hash(password, 10)

  // Référentiel de compétences (ajoute celles de la démo si absentes)
  const allSkillNames = [...new Set([...JOBS.flatMap((j) => j.skills), ...CANDIDATES.flatMap((c) => c.skills)])]
  for (const name of allSkillNames) await db.insert(skills).values({ name }).onConflictDoNothing()
  const skillRows = await db.select({ id: skills.id, name: skills.name }).from(skills).where(inArray(skills.name, allSkillNames))
  const skillId = new Map(skillRows.map((s) => [s.name, s.id]))

  // Entreprises + recruteurs
  const companyIds = new Map<string, { companyId: string; recruiterId: string }>()
  for (const [i, c] of COMPANIES.entries()) {
    const [recruiter] = await db.insert(profiles).values({
      email: i === 0 ? `recruteur${DOMAIN}` : `recruteur.${c.key}${DOMAIN}`,
      passwordHash, fullName: c.recruiter, role: 'recruiter', location: c.city, onboardingCompleted: true,
    }).returning({ id: profiles.id })
    const [company] = await db.insert(companies).values({
      ownerId: recruiter.id, name: c.name, sector: c.sector, city: c.city, location: c.city,
      description: `${c.name} recrute à La Réunion. Entreprise de démonstration Kazajob.`,
      size: '11-50', isVerified: i < 3, isSetupComplete: true,
    }).returning({ id: companies.id })
    await db.update(profiles).set({ companyId: company.id }).where(sql`${profiles.id} = ${recruiter.id}`)
    await db.insert(companyMembers).values({ companyId: company.id, recruiterId: recruiter.id, role: 'owner', status: 'active' })
    await db.insert(companySubscriptions).values({
      companyId: company.id, planId: i === 0 ? 'pro' : 'starter', status: 'trial', trialEndsAt: daysFromNow(21),
    })
    companyIds.set(c.key, { companyId: company.id, recruiterId: recruiter.id })
  }

  // Offres
  const jobIds: { id: string; seed: JobSeed; recruiterId: string }[] = []
  for (const j of JOBS) {
    const owner = companyIds.get(j.company)!
    const status = j.status ?? 'published'
    const created = new Date(Date.now() - (j.ageDays ?? 3) * DAY)
    const [row] = await db.insert(jobs).values({
      companyId: owner.companyId, recruiterId: owner.recruiterId, publishedBy: owner.recruiterId,
      title: j.title, location: j.city, jobType: j.type, remote: !!j.remote,
      sector: COMPANIES.find((c) => c.key === j.company)!.sector,
      salaryMin: j.min, salaryMax: j.max,
      description: `Rejoignez ${COMPANIES.find((c) => c.key === j.company)!.name} pour ce poste de ${j.title.replace(/ \(H\/F\)$/, '').toLowerCase()} à ${j.city}. Équipe soudée, ancrage local, perspectives d’évolution.`,
      missions: 'Accueillir et accompagner les clients\nTravailler en équipe au quotidien\nContribuer à la qualité du service',
      requirements: 'Première expérience appréciée · Motivation et sens du service',
      benefits: 'Mutuelle · Tickets restaurant · Primes',
      isBoosted: !!j.boosted, boostExpiresAt: j.boosted ? daysFromNow(10) : null,
      status, isActive: status === 'published',
      publishedAt: status === 'draft' ? null : created,
      expiresAt: status === 'published' ? new Date(created.getTime() + 60 * DAY) : status === 'expired' ? daysFromNow(-5) : null,
      views: 20 + Math.floor(Math.random() * 380),
      createdAt: created, updatedAt: created,
    }).returning({ id: jobs.id })
    for (const name of j.skills) {
      const sid = skillId.get(name)
      if (sid) await db.insert(jobSkills).values({ jobId: row.id, skillId: sid }).onConflictDoNothing()
    }
    jobIds.push({ id: row.id, seed: j, recruiterId: owner.recruiterId })
  }

  // Candidats
  const candidateIds: string[] = []
  for (const [i, c] of CANDIDATES.entries()) {
    const [row] = await db.insert(profiles).values({
      email: i === 0 ? `candidat${DOMAIN}` : `${c.name.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(' ', '.')}${DOMAIN}`,
      passwordHash, fullName: c.name, role: 'candidate', location: c.city, bio: BIO(c.name, c.city),
      xp: c.xp, streak: c.streak, onboardingCompleted: true, characterDomain: c.domain, gender: c.gender,
      avatarConfig: buildCharacterConfig(c.domain, c.gender),
      softSkills: ['Ponctualité', 'Esprit d’équipe'], hobbies: ['Randonnée', 'Musique'],
    }).returning({ id: profiles.id })
    for (const name of c.skills) {
      const sid = skillId.get(name)
      if (sid) await db.insert(candidateSkills).values({ candidateId: row.id, skillId: sid, level: 'advanced' }).onConflictDoNothing()
    }
    candidateIds.push(row.id)
  }

  // Candidatures : chaque candidat postule aux offres en ligne qui partagent au moins une compétence
  const STATUSES = ['pending', 'viewed', 'interview', 'pending', 'viewed', 'offer', 'rejected', 'hired'] as const
  let appCount = 0, interviewCount = 0
  const counts = new Map<string, number>()
  for (const [ci, c] of CANDIDATES.entries()) {
    const targets = jobIds.filter((j) => (j.seed.status ?? 'published') === 'published' && j.seed.skills.some((s) => c.skills.includes(s)))
    for (const [k, t] of targets.slice(0, 3).entries()) {
      const status = STATUSES[(ci + k) % STATUSES.length]
      const created = new Date(Date.now() - (k + 1) * 2 * DAY)
      const [app] = await db.insert(applications).values({
        jobId: t.id, candidateId: candidateIds[ci], status,
        coverLetter: `Bonjour, je suis très intéressé·e par le poste de ${t.seed.title}. Mon expérience à ${c.city} correspond à vos attentes.`,
        createdAt: created, updatedAt: created,
      }).returning({ id: applications.id })
      counts.set(t.id, (counts.get(t.id) ?? 0) + 1)
      appCount++
      if (status === 'interview' || status === 'offer') {
        await db.insert(interviews).values({
          applicationId: app.id, recruiterId: t.recruiterId, candidateId: candidateIds[ci], jobId: t.id,
          scheduledAt: daysFromNow(2 + k), durationMin: 45, type: 'video', status: 'confirmed',
          notes: 'Entretien de démonstration',
        })
        interviewCount++
      }
      if (k === 0) {
        const [conv] = await db.insert(conversations).values({ candidateId: candidateIds[ci], recruiterId: t.recruiterId, jobId: t.id }).returning({ id: conversations.id })
        await db.insert(messages).values([
          { conversationId: conv.id, senderId: t.recruiterId, content: `Bonjour ${c.name.split(' ')[0]}, merci pour votre candidature ! Êtes-vous disponible cette semaine pour un échange ?` },
          { conversationId: conv.id, senderId: candidateIds[ci], content: 'Bonjour, avec plaisir ! Je suis disponible jeudi ou vendredi.', isRead: false },
        ])
      }
    }
    await db.insert(notifications).values({
      userId: candidateIds[ci], type: 'new_job_match', title: 'Nouvelle offre pour toi',
      message: 'Une offre correspondant à tes compétences vient d’être publiée.', link: '/candidate/jobs',
    })
  }
  for (const [jobId, n] of counts) await db.update(jobs).set({ applicationsCount: n }).where(sql`${jobs.id} = ${jobId}`)

  console.log(`✅ Démo : ${COMPANIES.length} entreprises, ${JOBS.length} offres, ${CANDIDATES.length} candidats, ${appCount} candidatures, ${interviewCount} entretiens`)
  console.log(`   Connexion candidat  : candidat${DOMAIN}`)
  console.log(`   Connexion recruteur : recruteur${DOMAIN}`)
  console.log('   Mot de passe        : celui passé dans DEMO_PASSWORD')
}

async function main() {
  if (!process.argv.includes('--confirm-demo')) {
    console.error('❌ Ajoute --confirm-demo pour écrire des données de démo (base de TEST uniquement).')
    process.exit(1)
  }
  const password = process.env.DEMO_PASSWORD
  if (!password || password.length < 8) {
    console.error('❌ DEMO_PASSWORD requis (8 caractères minimum) : mot de passe des comptes de démo.')
    process.exit(1)
  }
  await runDemoSeed(defaultDb, password)
}

// Exécuté seulement en ligne de commande (pas à l'import depuis un test).
if (process.argv[1]?.includes('seed-demo')) main().then(() => process.exit(0)).catch((e) => { console.error('❌', e); process.exit(1) })
