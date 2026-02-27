'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Ticket, Users, Sparkles, ArrowRight, Star, Shield, Zap, User } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

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

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'EVENT_OWNER' || user?.role === 'ADMIN'
  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-kenyan-green/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-kenyan-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-kenyan-red/10 rounded-full blur-3xl animate-pulse-glow" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2 animate-fade-in">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-kenyan-green to-kenyan-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text font-bold">
              TicketHub
            </span>
          </Link>
          <div className="flex gap-2 items-center">
            {!loading && (
              <>
                {user ? (
                  // Logged in - show user menu
                  <div className="flex items-center gap-3">
                    {/* Switch to Attendee mode if organizer */}
                    {isOrganizer && (
                      <button
                        onClick={() => router.push('/dashboard/organizer')}
                        className="px-4 py-2 text-kenyan-cream/80 hover:text-white hover:bg-white/5 font-medium rounded-lg transition-all duration-300"
                      >
                        Organizer Dashboard
                      </button>
                    )}
                    
                    {/* Show Become Organizer if not organizer */}
                    {!isOrganizer && (
                      <Link
                        href="/become-organizer"
                        className="px-4 py-2 text-kenyan-gold hover:text-white hover:bg-white/5 font-medium rounded-lg transition-all duration-300"
                      >
                        Become Organizer
                      </Link>
                    )}

                    {/* User dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10">
                        <div className="w-8 h-8 bg-kenyan-green rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="p-2">
                          <p className="text-xs text-gray-400 px-2 py-1">Signed in as</p>
                          <p className="text-sm font-medium text-white px-2 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500 px-2 pb-2 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                          <hr className="my-2 border-gray-700" />
                          <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded w-full"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Not logged in - show login/signup
                  <>
                    <Link
                      href="/events"
                      className="px-4 py-2 text-kenyan-cream/80 hover:text-white hover:bg-white/5 font-medium rounded-lg transition-all duration-300"
                    >
                      Browse Events
                    </Link>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 text-kenyan-cream/80 hover:text-white hover:bg-white/5 font-medium rounded-lg transition-all duration-300"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 text-kenyan-cream/80 hover:text-white hover:bg-white/5 font-medium rounded-lg transition-all duration-300"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
            {/* Create Event button - only for organizers */}
            {isOrganizer && (
              <Link
                href="/events/create"
                className="px-5 py-2.5 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white rounded-lg font-semibold shadow-lg shadow-kenyan-green/30 hover:shadow-xl hover:shadow-kenyan-green/40 hover:scale-105 transition-all duration-300"
              >
                Create Event
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 md:py-32 text-center relative z-10">
        <div className="animate-fade-in-up max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-kenyan-gold/30 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-kenyan-gold" />
            <span className="text-sm text-kenyan-gold font-medium">Kenya's #1 Event Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-tight">
            Discover Kenya's
            <br />
            <span className="gradient-text text-glow">
              Hottest Events
            </span>
          </h1>
          <p className="text-lg md:text-xl text-kenyan-cream/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            From Nairobi's vibrant nightlife to coastal festivals — book your tickets instantly with Paystack. 
            Secure, fast, and trusted by thousands across Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Link
              href="/events"
              className="group px-8 py-4 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white rounded-xl font-bold text-lg shadow-xl shadow-kenyan-green/30 hover:shadow-kenyan-green hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Explore Events
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {isOrganizer && (
              <Link
                href="/events/create"
                className="px-8 py-4 glass border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 hover:scale-105 transition-all duration-300"
              >
                Create Event
              </Link>
            )}
            {!isOrganizer && user && (
              <Link
                href="/become-organizer"
                className="px-8 py-4 glass border border-kenyan-gold/30 text-kenyan-gold rounded-xl font-bold text-lg hover:bg-kenyan-gold/10 hover:scale-105 transition-all duration-300"
              >
                Become an Organizer
              </Link>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-kenyan-cream/60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-kenyan-green" />
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-kenyan-gold" />
              <span className="text-sm">Instant Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-kenyan-red" />
              <span className="text-sm">50K+ Users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-kenyan-cream/60">Events Hosted</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-kenyan-cream/60">Tickets Sold</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">5K+</div>
              <div className="text-kenyan-cream/60">Organizers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-kenyan-cream/60">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Why Choose <span className="gradient-text">TicketHub</span>
          </h2>
          <p className="text-kenyan-cream/60 max-w-2xl mx-auto">
            Built for the Kenyan market with love
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Calendar className="w-10 h-10" />}
            title="Discover Events"
            description="Browse through thousands of events by category, date, and location across Kenya."
            color="kenyan-green"
            delay="0"
          />
          <FeatureCard
            icon={<Ticket className="w-10 h-10" />}
            title="Secure Booking"
            description="Buy tickets safely with Paystack integration and instant mobile confirmation."
            color="kenyan-gold"
            delay="100"
          />
          <FeatureCard
            icon={<MapPin className="w-10 h-10" />}
            title="Easy Access"
            description="Quick QR code scanning at entry. Your ticket is always in your pocket."
            color="kenyan-red"
            delay="200"
          />
          <FeatureCard
            icon={<Users className="w-10 h-10" />}
            title="Real-time Analytics"
            description="Organizers get live attendance tracking and sales analytics dashboard."
            color="kenyan-accent"
            delay="300"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="glass-premium rounded-3xl p-12 md:p-16 text-center premium-border">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Host Your Event?
          </h2>
          <p className="text-kenyan-cream/70 max-w-2xl mx-auto mb-8">
            Join thousands of organizers already using TicketHub to sell tickets and manage events across Kenya.
          </p>
          <Link
            href={isOrganizer ? "/dashboard/organizer" : "/become-organizer"}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-kenyan-gold to-yellow-400 text-kenyan-black rounded-xl font-bold text-lg hover:shadow-kenyan-gold hover:scale-105 transition-all duration-300"
          >
            Start Selling Tickets
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-white/10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kenyan-green to-kenyan-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-kenyan-cream font-semibold">TicketHub</span>
          </div>
          <div className="text-center text-kenyan-cream/60 text-sm">
            <p>&copy; 2024 TicketHub Kenya. Powered by Paystack.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color = "kenyan-green",
  delay = "0",
}: {
  icon: React.ReactNode
  title: string
  description: string
  color?: string
  delay?: string
}) {
  const colorClasses: Record<string, string> = {
    "kenyan-green": "text-kenyan-green group-hover:text-kenyan-green",
    "kenyan-gold": "text-kenyan-gold group-hover:text-kenyan-gold",
    "kenyan-red": "text-kenyan-red group-hover:text-kenyan-red",
    "kenyan-accent": "text-kenyan-accent group-hover:text-kenyan-accent",
  }

  return (
    <div 
      className="glass-dark rounded-2xl p-8 hover:scale-105 transition-all duration-700 cursor-pointer card-hover group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`${colorClasses[color]} mb-6 group-hover:scale-125 transition-all duration-500 inline-block transform animate-float-slow`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-kenyan-cream transition-all duration-500">
        {title}
      </h3>
      <p className="text-kenyan-cream/70 leading-relaxed group-hover:text-kenyan-cream/90 transition-all duration-500 text-sm">
        {description}
      </p>
    </div>
  )
}
