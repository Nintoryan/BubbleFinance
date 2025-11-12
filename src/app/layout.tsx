import type { Metadata } from 'next'
import './globals.css'
import LoadingScreen from '@/components/LoadingScreen'

export const metadata: Metadata = {
  title: 'Bubble Finance',
  description: 'Сладкая булочка, финансовый трекер',
  manifest: '/manifest.json',
  icons: [
    { rel: 'apple-touch-icon', url: '/imgs/icon-192.png' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Family Finance" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/imgs/icon-192.png" />
        <link rel="icon" href="/imgs/icon-192.png" sizes="192x192" />
      </head>
      <body>
        <LoadingScreen />
        {children}
      </body>
    </html>
  )
}

