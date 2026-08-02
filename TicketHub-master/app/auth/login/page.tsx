'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react'

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
        // Store user ID in localStorage for ticket dashboard
        if (data.user?.id) {
          localStorage.setItem('TicketHub_userId', data.user.id)
        }
        
        // Redirect based on user role
        const role = data.user?.role
        if (role === 'ADMIN') {
          router.push('/dashboard/admin')
        } else if (role === 'ORGANIZER' || role === 'EVENT_OWNER') {
          router.push('/dashboard/organizer')
        } else if (role === 'PENDING_ORGANIZER') {
          // Show pending status - redirect to become-organizer page
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
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-kenyan-green/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-kenyan-gold/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full glass-dark rounded-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kenyan-green to-kenyan-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="gradient-text">TicketHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-kenyan-cream/60">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-kenyan-red/20 border border-kenyan-red/30 text-kenyan-red px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-kenyan-cream mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-kenyan-cream mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-kenyan-green hover:scale-[1.02] focus:ring-2 focus:ring-kenyan-green/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <p className="text-kenyan-cream/60">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-kenyan-gold hover:text-kenyan-cream font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-kenyan-cream/40 text-center mb-4">Quick Links</p>
          <div className="flex justify-center gap-4">
            <Link href="/events" className="text-sm text-kenyan-cream/60 hover:text-kenyan-gold transition-colors">
              Browse Events
            </Link>
            <span className="text-kenyan-cream/20">•</span>
            <Link href="/events/create" className="text-sm text-kenyan-cream/60 hover:text-kenyan-gold transition-colors">
              Create Event
            </Link>
          </div>
        </div>

        {/* Organizer CTA */}
        <div className="mt-6 p-4 glass rounded-xl border border-kenyan-gold/20">
          <p className="text-sm text-kenyan-cream/80 text-center mb-3">
            Want to host your own events?
          </p>
          <Link 
            href="/become-organizer" 
            className="block text-center text-kenyan-gold font-semibold hover:text-kenyan-cream transition-colors text-sm"
          >
            Apply to become an Organizer →
          </Link>
        </div>
      </div>
    </div>
  )
}
