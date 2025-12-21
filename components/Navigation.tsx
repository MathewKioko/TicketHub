'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Navigation() {

  return (
    <nav className="glass border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
            Ticket Hub
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/events" 
              className="text-gray-700 font-medium hover:text-primary-600 transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg hover:bg-primary-50"
            >
              Events
            </Link>
            <Link 
              href="/events/create" 
              className="text-gray-700 font-medium hover:text-primary-600 transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg hover:bg-primary-50"
            >
              Create Event
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

