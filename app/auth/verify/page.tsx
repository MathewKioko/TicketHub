'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ShieldCheck, CheckCircle, Star, Lock } from 'lucide-react'

export default function VerifyPage() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account verified successfully! You can now log in.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(data.error || 'Verification failed')
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
            <span className="text-xs tracking-wide uppercase text-gold-light font-medium">One Step Away</span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-bold text-ivory leading-[1.1] mb-8">
            Verify to unlock
            <br />
            <span className="gradient-text italic">your access</span>
          </h1>
          <p className="text-lg text-taupe max-w-md font-light leading-relaxed mb-12">
            Confirm your identity to start exploring the extraordinary. Your account is nearly ready.
          </p>

          {/* Trust badge */}
          <div className="glass-luxe rounded-2xl p-6 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-ivory">Secure Verification</p>
                <p className="text-sm text-taupe font-light">Your token is encrypted and private</p>
              </div>
            </div>
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
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/30 flex items-center justify-center shadow-glow">
              <Lock className="w-7 h-7 text-gold" />
            </div>
            <h1 className="font-display text-3xl font-bold text-ivory mb-2">Verify Your Account</h1>
            <p className="text-taupe">Enter your verification token</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-blush/10 border border-blush/30 text-blush px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-gold/10 border border-gold/30 text-gold-light px-4 py-3 rounded-xl text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {success}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-ivory/70 mb-2">
                Verification Token
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                <input
                  type="text"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all duration-200"
                  placeholder="Enter your verification token"
                  required
                />
              </div>
              <p className="text-xs text-taupe mt-2">
                Check your signup confirmation or console for the token
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx py-3.5 px-4 rounded-xl font-semibold hover:shadow-glow-lg hover:scale-[1.02] focus:ring-2 focus:ring-gold/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-taupe">
              <Link href="/auth/signup" className="text-gold hover:text-gold-light font-semibold">
                Back to Sign Up
              </Link>
              {' • '}
              <Link href="/auth/login" className="text-gold hover:text-gold-light font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

