import type { Metadata } from 'next'
import { Archivo, Instrument_Serif } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

const sans = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const display = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: '400',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'TicketHub — Events in Nairobi',
    template: '%s · TicketHub',
  },
  description:
    'Find concerts, theatre, comedy and conferences across Kenya. Pay with M-Pesa or card, and your QR ticket lands in your wallet as soon as payment clears.',
  openGraph: {
    title: 'TicketHub — Events in Nairobi',
    description:
      'Find concerts, theatre, comedy and conferences across Kenya. Pay with M-Pesa or card, and your QR ticket lands in your wallet as soon as payment clears.',
    type: 'website',
    locale: 'en_KE',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AuthProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[70] focus:bg-ink focus:px-3 focus:py-2 focus:text-xs focus:text-bone"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#FFFDF9',
                color: '#16130F',
                borderRadius: '2px',
                border: '1px solid #E3DACA',
                boxShadow: '0 16px 40px -16px rgba(22, 19, 15, 0.24)',
                padding: '12px 14px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#1C5C42', secondary: '#FFFDF9' } },
              error: { iconTheme: { primary: '#96201A', secondary: '#FFFDF9' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
