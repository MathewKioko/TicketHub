'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react'

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
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-kenyan-cream/60">Join Kenya's best event platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-kenyan-red/20 border border-kenyan-red/30 text-kenyan-red px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-kenyan-green/20 border border-kenyan-green/30 text-kenyan-green px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Registration Successful!</span>
              </div>
              <p className="text-kenyan-cream/80 text-xs">{success}</p>
              {verificationToken && (
                <div className="mt-3 p-3 bg-kenyan-black/50 rounded-lg border border-white/10">
                  <p className="text-xs font-medium text-kenyan-cream/60 mb-1">Verification Token:</p>
                  <code className="text-sm text-kenyan-gold bg-kenyan-black px-2 py-1.5 rounded block break-all">
                    {verificationToken}
                  </code>
                  <Link href="/auth/verify" className="text-xs mt-2 text-kenyan-gold hover:text-kenyan-cream underline block">
                    Click here to verify your account →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-kenyan-cream mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-kenyan-cream mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-kenyan-cream mb-2">
              Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Enter your phone number"
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                placeholder="Create a password (min 8 characters)"
                required
                minLength={8}
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
          <p className="text-kenyan-cream/60">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-kenyan-gold hover:text-kenyan-cream font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-kenyan-cream/40 text-center mb-4">Why join TicketHub?</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-kenyan-cream/60">
              <CheckCircle className="w-4 h-4 text-kenyan-green" />
              <span>Instant Tickets</span>
            </div>
            <div className="flex items-center gap-2 text-kenyan-cream/60">
              <CheckCircle className="w-4 h-4 text-kenyan-green" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-kenyan-cream/60">
              <CheckCircle className="w-4 h-4 text-kenyan-green" />
              <span>QR Entry</span>
            </div>
            <div className="flex items-center gap-2 text-kenyan-cream/60">
              <CheckCircle className="w-4 h-4 text-kenyan-green" />
              <span>Best Events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
