'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, User, Mail, Lock, Phone, ArrowRight, CheckCircle, Star, Shield, Zap } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! Use the verification token below to verify your account.')
        setVerificationToken(data.verificationToken || '')
      } else {
        setError(data.error || 'Registration failed')
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
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-luxe" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-10 w-80 h-80 bg-blush/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,11,0.5)_100%)]" />
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
            <span className="text-xs tracking-wide uppercase text-gold-light font-medium">Join the Inner Circle</span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-bold text-ivory leading-[1.1] mb-8">
            Your gateway to
            <br />
            <span className="gradient-text italic">unforgettable</span>
            <br />
            experiences
          </h1>
          <p className="text-lg text-taupe max-w-md font-light leading-relaxed mb-12">
            Create your account to access premier events, seamless booking, and instant digital passes — all in one elegant place.
          </p>

          {/* Benefits list */}
          <div className="space-y-4">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Secure & Private', desc: 'Your details are protected with bank-grade encryption.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Instant Tickets', desc: 'QR passes delivered the moment you book.' },
              { icon: <Star className="w-5 h-5" />, title: 'Exclusive Access', desc: 'Early access to curated events and VIP experiences.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 glass-luxe rounded-2xl p-5 max-w-sm">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/20 flex items-center justify-center text-gold">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-ivory">{item.title}</p>
                  <p className="text-sm text-taupe font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-taupe text-sm">
          <p>&copy; 2026 TicketHub. All rights reserved.</p>
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
            <h1 className="font-display text-3xl font-bold text-ivory mb-2">Create Account</h1>
            <p className="text-taupe">Join Kenya's premium event platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-blush/10 border border-blush/30 text-blush px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-gold/10 border border-gold/30 text-gold-light px-4 py-3 rounded-xl text-sm animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Registration Successful!</span>
                </div>
                <p className="text-ivory/80 text-xs">{success}</p>
                {verificationToken && (
                  <div className="mt-3 p-3 bg-coal/70 rounded-lg border border-white/10">
                    <p className="text-xs font-medium text-taupe mb-1">Verification Token:</p>
                    <code className="text-sm text-gold bg-onyx px-2 py-1.5 rounded block break-all">
                      {verificationToken}
                    </code>
                    <Link href="/auth/verify" className="text-xs mt-2 text-gold hover:text-gold-light underline block">
                      Click here to verify your account →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ivory/70 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ivory/70 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ivory/70 mb-2">
                Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Enter your phone number"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                  placeholder="Create a password (min 8 characters)"
                  required
                  minLength={8}
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-taupe">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gold hover:text-gold-light font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 pt-6 divider-gold">
            <p className="text-xs text-taupe/60 text-center mb-4 tracking-wide uppercase">Why join TicketHub?</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-ivory/60">
                <CheckCircle className="w-4 h-4 text-gold" />
                <span>Instant Tickets</span>
              </div>
              <div className="flex items-center gap-2 text-ivory/60">
                <CheckCircle className="w-4 h-4 text-gold" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-ivory/60">
                <CheckCircle className="w-4 h-4 text-gold" />
                <span>QR Entry</span>
              </div>
              <div className="flex items-center gap-2 text-ivory/60">
                <CheckCircle className="w-4 h-4 text-gold" />
                <span>Best Events</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

