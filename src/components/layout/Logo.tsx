import Link from 'next/link'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  mono?: boolean
  color?: string
  accentColor?: string
  href?: string
  className?: string
}

export function Logo({ size = 32, href = '/', className }: LogoProps) {
  const iconSize = Math.round(size * 1.1)
  const iconWidth = Math.round(iconSize * (532 / 661.43))
  const cls1 = '#E9D5FF' // Quest : trait lavande lumineux
  const gradientId = `kazajob-logo-gradient-${useId()}`

  const content = (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <svg width={iconWidth} height={iconSize} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 532 661.43">
        <defs>
          <linearGradient id={gradientId} x1="-96.43" y1="534.89" x2="429.76" y2="-3.1" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E879F9"/>
            <stop offset=".55" stopColor="#A855F7"/>
            <stop offset="1" stopColor="#FACC15"/>
          </linearGradient>
        </defs>
        <g>
          <path stroke={cls1} strokeWidth="30" fill="transparent" strokeLinecap="round" strokeLinejoin="round" d="M499.21,79.8L187.43,391.62c-6.22,6.22-13.15,11.32-20.54,15.25v241.54H50.43c-22.32,0-40.43-18.11-40.43-40.43V52.94c0-21.06,17.13-38.18,38.18-38.18h118.71v186.89L333.47,35.02c33.41-33.36,87.55-33.36,120.96,0l44.78,44.78Z"/>
            <circle cx="390.74" cy="520.18" r="131.26" stroke={`url(#${gradientId})`} fill="transparent" strokeWidth="30"/>
        </g>
      </svg>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
