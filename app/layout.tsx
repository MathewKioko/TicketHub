import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Navigation } from '@/components/Navigation'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'TicketHub — The Premium Event Experience',
  description: 'Discover, book, and attend extraordinary events. Create events, manage tickets, and track attendance in real time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <Navigation />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#17171A',
              color: '#F5F1E8',
              borderRadius: '12px',
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 122, 0.1)',
              padding: '16px',
              border: '1px solid rgba(212, 175, 122, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#D4AF7A',
                secondary: '#0A0A0B',
              },
            },
            error: {
              iconTheme: {
                primary: '#C97F66',
                secondary: '#0A0A0B',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

