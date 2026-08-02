'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight, Shield, Star, MapPin, Clock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.user?.id) {
          localStorage.setItem('TicketHub_userId', data.user.id)
        }

        const role = data.user?.role
        if (role === 'ADMIN') {
          router.push('/dashboard/admin')
        } else if (role === 'ORGANIZER' || role === 'EVENT_OWNER') {
          router.push('/dashboard/organizer')
        } else if (role === 'PENDING_ORGANIZER') {
          router.push('/become-organizer?status=pending')
        } else {
          router.push('/dashboard/attendee')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-onyx flex relative overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-luxe" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-10 w-80 h-80 bg-blush/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,11,0.5)_100%)]" />
          {/* Gold vertical divider accent */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
        </div>

        <div className="relative z-10">
<Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gold/20 rounded-xl blur-sm" />
              <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="TicketHub"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
            <span className="font-display text-2xl font-bold gradient-text">TicketHub</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-gold border border-gold/25 mb-8">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-xs tracking-wide uppercase text-gold-light font-medium">Curated • Exclusive • Premium</span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-bold text-ivory leading-[1.1] mb-8">
            Welcome back to
            <br />
            <span className="gradient-text italic">the Extraordinary</span>
          </h1>
          <p className="text-lg text-taupe max-w-md font-light leading-relaxed mb-12">
            Access your private collection of premier events. From rooftop soirées to grand festivals — your next unforgettable moment awaits.
          </p>

          {/* Testimonials */}
          <div className="space-y-4">
            <div className="glass-luxe rounded-2xl p-5 max-w-sm">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm text-ivory/70 font-light leading-relaxed">
                "TicketHub has completely changed how I discover events. Every experience has felt hand-picked for me."
              </p>
              <p className="text-xs text-taupe mt-3">— Amara N., Nairobi</p>
            </div>
            <div className="glass-luxe rounded-2xl p-5 max-w-sm">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm text-ivory/70 font-light leading-relaxed">
                "The QR entry is seamless. I arrived, scanned, and was inside within seconds."
              </p>
              <p className="text-xs text-taupe mt-3">— Brian K., Mombasa</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-taupe text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" />
            Secure Payments
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold" />
            Nationwide
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            24/7 Access
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blush/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-md w-full glass-luxe rounded-2xl p-8 md:p-10 relative z-10 animate-fade-in-up">
          <div className="text-center mb-10">
<Link href="/" className="inline-flex items-center gap-2.5 mb-6 group lg:hidden">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gold/20 rounded-xl blur-sm" />
                <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <img
                    src="/logo.png"
                    alt="TicketHub"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>
              <span className="font-display text-3xl font-bold gradient-text">TicketHub</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-ivory mb-2">Welcome Back</h1>
            <p className="text-taupe">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-blush/10 border border-blush/30 text-blush px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ivory/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ivory/70 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx py-3.5 px-4 rounded-xl font-semibold hover:shadow-glow-lg hover:scale-[1.02] focus:ring-2 focus:ring-gold/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-onyx/30 border-t-onyx rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-taupe">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-gold hover:text-gold-light font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 divider-gold">
            <p className="text-xs text-taupe/60 text-center mb-4 tracking-wide uppercase">Quick Links</p>
            <div className="flex justify-center gap-4">
              <Link href="/events" className="text-sm text-taupe hover:text-gold transition-colors">
                Browse Events
              </Link>
              <span className="text-taupe/20">•</span>
              <Link href="/events/create" className="text-sm text-taupe hover:text-gold transition-colors">
                Create Event
              </Link>
            </div>
          </div>

          {/* Organizer CTA */}
          <div className="mt-6 p-4 glass rounded-xl border border-gold/20 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gold flex-shrink-0" />
            <p className="text-sm text-ivory/70">
              Want to host your own events?{' '}
              <Link href="/become-organizer" className="text-gold font-semibold hover:text-gold-light transition-colors">
                Apply now →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

