'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { User, LogOut, Calendar, Menu, X, Ticket, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
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
      localStorage.removeItem('TicketHub_userId')
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'EVENT_OWNER' || user?.role === 'ADMIN'
  const isAttendee = user?.role === 'ATTENDEE' || user?.role === 'PENDING_ORGANIZER' || user?.role === 'SCANNER'

  return (
    <nav className="sticky top-0 z-50 glass-dark border-b border-gold/10 backdrop-blur-xl shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href={user ? '/events' : '/auth/login'} className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gold/20 rounded-xl blur-sm" />
              <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="TicketHub"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
            <span className="font-display text-2xl font-bold gradient-text">
              TicketHub
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-ivory/80 hover:text-gold transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/events"
              className="text-sm font-medium text-ivory/70 hover:text-gold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gold/5"
            >
              Browse Events
            </Link>

            {loading ? (
              <div className="w-20 h-10 bg-gold/10 animate-pulse rounded-lg border border-gold/10" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* My Tickets - always visible when logged in */}
                <Link
                  href="/dashboard/attendee"
                  className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-light transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gold/10 border border-gold/20"
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>

                {/* Create Event - only for organizers */}
                {isOrganizer && (
                  <Link
                    href="/events/create"
                    className="text-sm font-medium text-ivory/70 hover:text-gold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gold/5"
                  >
                    Create Event
                  </Link>
                )}

                {/* Organizer Dashboard quick access - for attendees & organizers */}
                {isOrganizer && (
                  <Link
                    href="/dashboard/organizer"
                    className="flex items-center gap-1.5 text-sm font-medium text-gold-light hover:text-gold transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gold/10 border border-gold/15"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Organizer
                  </Link>
                )}

                {isAttendee && !isOrganizer && (
                  <Link
                    href="/become-organizer"
                    className="text-xs text-gold hover:text-gold-light font-medium px-2.5 py-1.5 rounded-lg hover:bg-gold/10 border border-gold/20 transition-all"
                  >
                    Become Organizer
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gold/10 transition-colors border border-transparent hover:border-gold/20">
                    <div className="w-9 h-9 bg-gradient-to-br from-gold-light via-gold to-gold-dark rounded-full flex items-center justify-center shadow-glow">
                      <span className="text-xs font-bold text-onyx">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-ivory leading-tight truncate max-w-[120px]">
                        {user.name || user.email}
                      </p>
                      <p className="text-[11px] text-taupe capitalize leading-tight">
                        {user.role.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-coal rounded-xl shadow-premium-lg border border-gold/15 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <p className="text-xs text-taupe px-2 py-1">Signed in as</p>
                      <p className="text-sm font-medium text-ivory px-2 truncate">{user.email}</p>
                      <p className="text-xs text-gold px-2 pb-2 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                      <hr className="my-2 border-gold/10" />

                      {/* My Tickets */}
                      <Link
                        href="/dashboard/attendee"
                        className="flex items-center gap-2 px-2 py-2 text-sm text-ivory hover:bg-gold/10 hover:text-gold rounded"
                      >
                        <Ticket className="w-4 h-4" />
                        My Tickets
                      </Link>

                      {/* Dashboard based on role */}
                      {isOrganizer && (
                        <Link
                          href="/dashboard/organizer"
                          className="flex items-center gap-2 px-2 py-2 text-sm text-ivory hover:bg-gold/10 hover:text-gold rounded"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Organizer Dashboard
                        </Link>
                      )}

                      {/* Attendee dashboard */}
                      <Link
                        href="/dashboard/attendee"
                        className="flex items-center gap-2 px-2 py-2 text-sm text-ivory hover:bg-gold/10 hover:text-gold rounded"
                      >
                        <Calendar className="w-4 h-4" />
                        Attendee Dashboard
                      </Link>

                      <hr className="my-2 border-gold/10" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-blush hover:bg-blush/10 rounded w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-ivory/70 hover:text-gold transition-all duration-300 px-3 py-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx font-medium rounded-lg hover:shadow-glow-lg hover:scale-105 transition-transform duration-300"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in-down">
            <div className="flex flex-col gap-2">
              <Link
                href="/events"
                className="text-ivory/80 font-medium px-3 py-2 rounded-lg hover:bg-gold/10 hover:text-gold"
                onClick={() => setMenuOpen(false)}
              >
                Browse Events
              </Link>

              {user ? (
                <>
                  {/* My Tickets */}
                  <Link
                    href="/dashboard/attendee"
                    className="flex items-center gap-2 text-gold font-medium px-3 py-2 rounded-lg hover:bg-gold/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Ticket className="w-4 h-4" />
                    My Tickets
                  </Link>

                  {isOrganizer && (
                    <Link
                      href="/events/create"
                      className="text-ivory/80 font-medium px-3 py-2 rounded-lg hover:bg-gold/10 hover:text-gold"
                      onClick={() => setMenuOpen(false)}
                    >
                      Create Event
                    </Link>
                  )}

                  {isOrganizer && (
                    <Link
                      href="/dashboard/organizer"
                      className="flex items-center gap-2 text-gold-light font-medium px-3 py-2 rounded-lg hover:bg-gold/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Organizer Dashboard
                    </Link>
                  )}

                  {isAttendee && !isOrganizer && (
                    <Link
                      href="/become-organizer"
                      className="text-gold font-medium px-3 py-2 rounded-lg hover:bg-gold/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      Become Organizer
                    </Link>
                  )}

                  <div className="border-t border-gold/10 my-2 pt-2">
                    <p className="text-xs text-taupe px-3 py-1">
                      Signed in as <span className="text-ivory font-medium">{user.name || user.email}</span>
                    </p>
                    <p className="text-xs text-gold px-3 pb-2 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                  </div>

                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="text-left text-blush font-medium px-3 py-2 rounded-lg hover:bg-blush/10"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 text-ivory/80 font-medium px-3 py-2 rounded-lg hover:bg-gold/10 hover:text-gold"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx font-medium rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
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

