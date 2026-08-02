'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Ticket, Users, Sparkles, ArrowRight, Star, Shield, Zap, User, ChevronDown, Clock } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

interface FeaturedEvent {
  id: string
  title: string
  venue: string
  date: string
  category: string
  imageUrl?: string
  basePrice: number
  organizer: { name: string }
  _count: { tickets: number }
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([])

  useEffect(() => {
    checkAuth()
    fetchFeaturedEvents()
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

  const fetchFeaturedEvents = async () => {
    try {
      const res = await fetch('/api/events?limit=3')
      const data = await res.json()
      if (res.ok) {
        setFeaturedEvents(data.events?.slice(0, 3) || [])
      }
    } catch (error) {
      console.error('Error fetching featured events:', error)
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
    <div className="min-h-screen bg-luxe relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gold/5 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-blush/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,122,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,122,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,11,0.5)_100%)]" />
      </div>

{/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-16 md:pt-24 pb-12 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold border border-gold/25 mb-8">
              <Star className="w-3 h-3 text-gold" />
              <span className="text-[11px] text-gold-light tracking-wide font-medium uppercase">Curated Events • By Invitation</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-ivory mb-6 leading-[1.05]">
              Experience the
              <br />
              <span className="gradient-text text-glow font-display italic">
                Extraordinary
              </span>
            </h1>

            <p className="text-base md:text-lg text-taupe mb-10 max-w-xl mx-auto leading-relaxed font-light">
              An exclusive collection of premier events — from intimate rooftop soirées to grand cultural festivals.
              Secure your place among the discerning few.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/events"
                className="group px-8 py-3.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-full font-semibold text-base shadow-glow-lg hover:shadow-glow-xl hover:scale-[1.03] transition-all duration-200 flex items-center gap-2"
              >
                Explore the Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              {isOrganizer && (
                <Link
                  href="/events/create"
                  className="px-8 py-3.5 glass border border-gold/20 text-gold-light rounded-full font-semibold text-base hover:bg-gold/10 hover:scale-[1.03] transition-all duration-200"
                >
                  Curate an Event
                </Link>
              )}
              {!isOrganizer && user && (
                <Link
                  href="/become-organizer"
                  className="px-8 py-3.5 glass border border-gold/20 text-gold-light rounded-full font-semibold text-base hover:bg-gold/10 hover:scale-[1.03] transition-all duration-200"
                >
                  Become an Organizer
                </Link>
              )}
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap justify-center gap-10 text-taupe">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-gold" />
                <span className="text-sm">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-gold" />
                <span className="text-sm">Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-gold" />
                <span className="text-sm">Trusted by 50K+ Guests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <div className="container mx-auto px-4 pb-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Handpicked</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                  Featured <span className="gradient-text italic">Events</span>
                </h2>
              </div>
              <Link href="/events" className="text-gold hover:text-gold-light text-sm font-medium inline-flex items-center gap-1.5 group">
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group">
                  <div className="luxe-card overflow-hidden hover:scale-[1.02] transition-all duration-500 card-hover h-full">
                    {event.imageUrl ? (
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/20 to-transparent" />
                        <span className="absolute top-4 left-4 pill-gold">{event.category}</span>
                      </div>
                    ) : (
                      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-ash to-coal flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-gold/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-transparent to-transparent" />
                        <span className="absolute top-4 left-4 pill-gold">{event.category}</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-display text-xl font-bold text-ivory mb-2 group-hover:text-gold transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="space-y-2.5 text-sm text-taupe mb-5">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-gold/60 flex-shrink-0" />
                          <span className="line-clamp-1">{new Date(event.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-gold/60 flex-shrink-0" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 divider-gold">
                        <span className="text-taupe text-xs">From</span>
                        <span className="font-display text-xl font-bold gradient-text">
                          KES {event.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Banner */}
      <div className="container mx-auto px-4 pb-20 relative z-10">
        <div className="glass-luxe rounded-3xl p-10 md:p-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-taupe text-sm tracking-wide">Events Hosted</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-taupe text-sm tracking-wide">Tickets Sold</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">5K+</div>
              <div className="text-taupe text-sm tracking-wide">Organizers</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-taupe text-sm tracking-wide">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3">The Experience</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-ivory mb-4">
            Crafted for the <span className="gradient-text italic">Discerning</span>
          </h2>
          <p className="text-taupe max-w-2xl mx-auto font-light">
            Every detail considered, so you can focus on what matters — the moment.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Curated Discoveries"
            description="Browse a hand-selected portfolio of exclusive events across Kenya's premier venues."
            delay="0"
          />
          <FeatureCard
            icon={<Ticket className="w-8 h-8" />}
            title="Seamless Booking"
            description="Reserve your place in moments. Instant confirmation, elegant digital passes."
            delay="100"
          />
          <FeatureCard
            icon={<MapPin className="w-8 h-8" />}
            title="Effortless Entry"
            description="QR passes on your device. Arrive and be welcomed — no queues, no hassle."
            delay="200"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Insightful Analytics"
            description="Organizers access refined, real-time attendance intelligence and sales data."
            delay="300"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="glass-luxe rounded-3xl p-12 md:p-20 text-center premium-border">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-ivory mb-6">
            Ready to Host Your <span className="gradient-text italic">Masterpiece</span>?
          </h2>
          <p className="text-taupe max-w-2xl mx-auto mb-10 font-light text-lg">
            Join a select group of organizers creating unforgettable experiences on TicketHub.
          </p>
          <Link
            href={isOrganizer ? "/dashboard/organizer" : "/become-organizer"}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-full font-semibold text-lg hover:shadow-glow-xl hover:scale-105 transition-all duration-300"
          >
            Start Curating Experiences
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 divider-fade relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
<div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gold/20 rounded-xl blur-sm" />
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="TicketHub"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
            <div>
              <span className="font-display text-lg font-bold gradient-text">TicketHub</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-taupe">Premium Events</span>
            </div>
          </div>
          <div className="text-center text-taupe text-sm font-light">
            <p>&copy; 2026 TicketHub. All rights reserved.</p>
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
  delay = "0",
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: string
}) {
  return (
    <div
      className="luxe-card rounded-2xl p-8 hover:scale-105 transition-all duration-700 cursor-pointer card-hover group text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/20 flex items-center justify-center text-gold group-hover:shadow-glow group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-ivory mb-3 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-taupe leading-relaxed group-hover:text-ivory/70 transition-colors text-sm font-light">
        {description}
      </p>
    </div>
  )
}

