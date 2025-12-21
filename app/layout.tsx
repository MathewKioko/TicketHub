import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ticket Hub - The Future of Event Management',
  description: 'Discover, book, and attend events with ease. Create events, manage tickets, and track attendance in real time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1f2937',
              borderRadius: '12px',
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

