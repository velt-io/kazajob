import { Crown, Gem, Shield, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { RARITY_META, RARITY_TONE, type Rarity } from './hero'
import { toneStyle } from './QuestChrome'

const RARITY_ICON = { commune: Shield, rare: Gem, epique: Sparkles, legendaire: Crown } as const

/** Portrait de héros serti dans un losange à la couleur de sa rareté. */
export function HeroPortrait({ name, src, avatarConfig, size = 64, rarity = 'commune', className }: {
  name: string
  src?: string | null
  avatarConfig?: Record<string, unknown> | null
  size?: number
  rarity?: Rarity
  className?: string
}) {
  return (
    <span className={cn('qxr-portrait', className)} data-rarity={rarity}
      style={toneStyle(RARITY_TONE[rarity], { width: size, height: size })}>
      <span className="qxr-portrait-frame">
        <span className="qxr-portrait-face">
          <Avatar name={name || '?'} src={src} avatarConfig={avatarConfig} size={Math.round(size * 0.8)} color="transparent" />
        </span>
      </span>
    </span>
  )
}

/** Pastille de rareté (icône + libellé). */
export function RarityTag({ rarity, label, className }: { rarity: Rarity; label?: string; className?: string }) {
  const Icon = RARITY_ICON[rarity]
  return (
    <span className={cn('qxr-rarity', className)} style={toneStyle(RARITY_TONE[rarity])}>
      <Icon size={10} aria-hidden />{label ?? RARITY_META[rarity].label}
    </span>
  )
}
