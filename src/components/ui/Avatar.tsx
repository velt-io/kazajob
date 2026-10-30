'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'
import { generateAvatarSvg, hasAvatarConfig, type AvatarConfig } from '@/lib/avatar'

interface AvatarProps {
  name: string
  src?: string | null
  avatarConfig?: AvatarConfig | Record<string, unknown> | null
  size?: number
  color?: string
  badge?: boolean
  className?: string
}

// Priorité d'affichage : avatar personnalisé (DiceBear) > photo > initiales.
export function Avatar({ name, src, avatarConfig, size = 40, color = '#FFE0CF', badge, className }: AvatarProps) {
  const init = initials(name)
  const px   = `${size}px`

  // Génération SVG locale et déterministe : rendu immédiat, identique serveur/client.
  const configKey = hasAvatarConfig(avatarConfig) ? JSON.stringify(avatarConfig) : null
  const svg = useMemo(
    () => (configKey ? generateAvatarSvg(JSON.parse(configKey)) : null),
    [configKey],
  )

  return (
    <div
      className={cn('relative shrink-0 inline-flex', className)}
      style={{ width: px, height: px }}
    >
      <div
        className="w-full h-full rounded-full border-[1.5px] border-[#1A1410] flex items-center justify-center font-bold overflow-hidden"
        style={{ background: color, fontSize: size * 0.36 }}
      >
        {svg ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
            role="img"
            aria-label={name}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <span className="text-[#1A1410]">{init}</span>
        )}
      </div>
      {badge && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
          style={{ background: '#19A974' }}
        />
      )}
    </div>
  )
}
