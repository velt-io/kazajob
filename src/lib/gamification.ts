import type { Profile } from '@/lib/types'

export interface GamificationLevel {
  level:  number
  title:  string
  minXp:  number
  maxXp:  number
  color:  string
  bg:     string
  emoji:  string
}

export const LEVELS: GamificationLevel[] = [
  { level: 1, title: 'Débutant',    minXp: 0,     maxXp: 999,   color: '#6B5A4A', bg: '#FBEFE0', emoji: '🌱' },
  { level: 2, title: 'Candidat',    minXp: 1000,  maxXp: 2499,  color: '#FF6B35', bg: '#FFE0CF', emoji: '⚡' },
  { level: 3, title: 'Explorateur', minXp: 2500,  maxXp: 4999,  color: '#6D3BEB', bg: '#E5DCFF', emoji: '🔮' },
  { level: 4, title: 'Chasseur',    minXp: 5000,  maxXp: 9999,  color: '#19A974', bg: '#D6F0E0', emoji: '🎯' },
  { level: 5, title: 'Expert 974',  minXp: 10000, maxXp: 99999, color: '#FFC93C', bg: '#FFF1C2', emoji: '👑' },
]

export function getLevel(xp: number): GamificationLevel {
  return [...LEVELS].reverse().find(l => xp >= l.minXp) ?? LEVELS[0]
}

export function getNextLevel(xp: number): GamificationLevel {
  return LEVELS.find(l => l.minXp > xp) ?? LEVELS[LEVELS.length - 1]
}

export function getXpProgress(xp: number): number {
  const current = getLevel(xp)
  const next    = getNextLevel(xp)
  if (current.level === LEVELS[LEVELS.length - 1].level) return 100
  return Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
}

export type QuestCategory = 'profile' | 'job' | 'daily' | 'social'

export interface Quest {
  id:        string
  title:     string
  desc:      string
  xpReward:  number
  completed: boolean
  progress:  number
  category:  QuestCategory
  iconName:  string
  accentColor: string
}

function profileScore(p: Profile): number {
  const fields = [p.full_name, p.bio, p.location, p.phone, p.cv_url, p.avatar_url]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

export function computeQuests(
  profile: Profile | null,
  applicationsCount: number,
  favoritesCount:    number,
  skillsCount:       number,
): Quest[] {
  if (!profile) return []
  const score = profileScore(profile)

  return [
    {
      id: 'complete_profile',
      title: 'Héros du profil',
      desc: 'Complète ton profil à 80%',
      xpReward: 50,
      completed: score >= 80,
      progress: Math.min(score, 100),
      category: 'profile',
      iconName: 'User',
      accentColor: '#FF6B35',
    },
    {
      id: 'upload_cv',
      title: 'CV Power',
      desc: 'Uploade ton CV ou crée-le dans le builder',
      xpReward: 50,
      completed: !!(profile.cv_url || profile.cv_data),
      progress: (profile.cv_url || profile.cv_data) ? 100 : 0,
      category: 'profile',
      iconName: 'FileText',
      accentColor: '#FF6B35',
    },
    {
      id: 'add_skills',
      title: 'Skill Hunter',
      desc: 'Ajoute au moins 3 compétences',
      xpReward: 40,
      completed: skillsCount >= 3,
      progress: Math.min(Math.round((skillsCount / 3) * 100), 100),
      category: 'profile',
      iconName: 'Zap',
      accentColor: '#FF6B35',
    },
    {
      id: 'video_pitch',
      title: 'Star du Pitch',
      desc: 'Enregistre ton pitch vidéo (60s)',
      xpReward: 100,
      completed: !!profile.video_pitch_url,
      progress: profile.video_pitch_url ? 100 : 0,
      category: 'profile',
      iconName: 'Video',
      accentColor: '#6D3BEB',
    },
    {
      id: 'first_apply',
      title: 'Premier pas',
      desc: 'Postule à ta 1ère offre',
      xpReward: 30,
      completed: applicationsCount >= 1,
      progress: applicationsCount >= 1 ? 100 : 0,
      category: 'job',
      iconName: 'Send',
      accentColor: '#6D3BEB',
    },
    {
      id: 'apply_3',
      title: 'Candidat sérieux',
      desc: 'Postule à 3 offres différentes',
      xpReward: 75,
      completed: applicationsCount >= 3,
      progress: Math.min(Math.round((applicationsCount / 3) * 100), 100),
      category: 'job',
      iconName: 'Target',
      accentColor: '#6D3BEB',
    },
    {
      id: 'save_favorite',
      title: 'Chasseur d\'offres',
      desc: 'Sauvegarde une offre en favoris',
      xpReward: 20,
      completed: favoritesCount >= 1,
      progress: favoritesCount >= 1 ? 100 : 0,
      category: 'job',
      iconName: 'Heart',
      accentColor: '#19A974',
    },
    {
      id: 'streak_3',
      title: 'Série de feu',
      desc: 'Maintiens ton streak 3 jours de suite',
      xpReward: 30,
      completed: (profile.streak ?? 0) >= 3,
      progress: Math.min(Math.round(((profile.streak ?? 0) / 3) * 100), 100),
      category: 'daily',
      iconName: 'Flame',
      accentColor: '#FFC93C',
    },
    {
      id: 'boost_profile',
      title: 'KazaBoost activé',
      desc: 'Booste ton profil pour être mis en avant',
      xpReward: 25,
      completed: !!(profile.boosted_until && new Date(profile.boosted_until) > new Date()),
      progress: (profile.boosted_until && new Date(profile.boosted_until) > new Date()) ? 100 : 0,
      category: 'daily',
      iconName: 'TrendingUp',
      accentColor: '#FFC93C',
    },
  ]
}
