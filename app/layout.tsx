import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BMW M5 — Power Unleashed',
  description: 'Explore the new BMW M5: electrified M performance, designed to be felt.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080c10',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
