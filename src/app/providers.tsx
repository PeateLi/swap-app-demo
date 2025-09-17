'use client'

import { HeroUIProvider } from '@heroui/react'
import { Provider as JotaiProvider } from 'jotai'
import { OAuthProvider } from '../providers/OAuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <HeroUIProvider>
        <OAuthProvider>
          {children}
        </OAuthProvider>
      </HeroUIProvider>
    </JotaiProvider>
  )
}
