import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'

export const metadata: Metadata = {
  title: 'Miela CRM | TodoAlRojo',
  description: 'Advanced Identity Graph + Journey Tracking System with CRM capabilities',
  keywords: ['CRM', 'Identity Graph', 'Journey Tracking', 'Lead Management', 'Campaign Analytics'],
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <QueryProvider>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}