'use client'

import { HeroUIProvider } from '@heroui/react'
import { Provider as JotaiProvider } from 'jotai'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </JotaiProvider>
  )
}
