'use client'

import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/radix'
import { DynamicIsland } from '@/components/os/DynamicIsland'
import { MotionLayer } from '@/components/os/MotionLayer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={250}>
        {children}
        <DynamicIsland />
        <MotionLayer />
      </TooltipProvider>
    </SessionProvider>
  )
}
