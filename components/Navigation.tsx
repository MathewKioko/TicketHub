'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, User, LogOut, Calendar, Menu, X } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export function Navigation() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      // Not logged in
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const switchToMode = (mode: 'organizer' | 'attendee') => {
    if (mode === 'organizer') {
      router.push('/dashboard/organizer')
    } else {
      router.push('/dashboard/attendee')
    }
  }

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'EVENT_OWNER' || user?.role === 'ADMIN'
  const isAttendee = user?.role === 'ATTENDEE' || user?.role === 'PENDING_ORGANIZER' || user?.role === 'SCANNER'

  return (
    <nav className="glass border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
            Ticket Hub
          </Link>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/events" 
              className="text-gray-700 font-medium hover:text-primary-600 transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg hover:bg-primary-50"
            >
              Events
            </Link>

            {loading ? (
              // Loading state
              <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg" />
            ) : user ? (
              // Logged in - show user menu
              <div className="flex items-center gap-3">
                {/* Create Event - only for organizers */}
                {isOrganizer && (
                  <Link 
                    href="/events/create" 
                    className="text-gray-700 font-medium hover:text-primary-600 transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg hover:bg-primary-50"
                  >
                    Create Event
                  </Link>
                )}

                {/* Role Switcher */}
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                  {isOrganizer && (
                    <button
                      onClick={() => switchToMode('attendee')}
                      className="text-sm text-gray-600 hover:text-primary-600 px-2 py-1 rounded hover:bg-primary-50"
                    >
                      Attendee Mode
                    </button>
                  )}
                  {isAttendee && (
                    <button
                      onClick={() => switchToMode('organizer')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50"
                    >
                      Switch to Organizer
                    </button>
                  )}
                </div>

                {/* User dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name || user.email}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <p className="text-xs text-gray-500 px-2 py-1">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 px-2 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500 px-2 pb-2 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                      <hr className="my-2" />
                      <Link 
                        href={isOrganizer ? '/dashboard/organizer' : '/dashboard/attendee'}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <Calendar className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Not logged in - show login/signup
              <div className="flex items-center gap-3">
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 font-medium hover:text-primary-600 transition-all duration-300 px-3 py-2"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:scale-105 transition-transform duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col gap-2">
              <Link 
                href="/events" 
                className="text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Events
              </Link>

              {user ? (
                <>
                  {isOrganizer && (
                    <Link 
                      href="/events/create" 
                      className="text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      Create Event
                    </Link>
                  )}
                  
                  {isOrganizer && (
                    <button
                      onClick={() => { switchToMode('attendee'); setMenuOpen(false); }}
                      className="text-left text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      Switch to Attendee Mode
                    </button>
                  )}
                  
                  {isAttendee && (
                    <button
                      onClick={() => { switchToMode('organizer'); setMenuOpen(false); }}
                      className="text-left text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      Switch to Organizer
                    </button>
                  )}
                  
                  <Link 
                    href={isOrganizer ? '/dashboard/organizer' : '/dashboard/attendee'}
                    className="text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  <button 
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="text-left text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="text-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
