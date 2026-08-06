'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to send reset link')
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
          <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-kenyan-cream/60">Enter your email to receive a reset link</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-kenyan-green/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-kenyan-green" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Check Your Email</h2>
            <p className="text-kenyan-cream/70 mb-6">
              If an account exists for <span className="text-kenyan-gold font-semibold">{email}</span>,
              we've sent a password reset link. Please check your inbox (and spam folder).
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSuccess(false)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-kenyan-green hover:scale-[1.02] transition-all duration-200"
              >
                Send Another Link
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/auth/login"
                className="w-full text-center py-3 text-kenyan-cream/60 hover:text-kenyan-gold transition-colors text-sm"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-kenyan-green hover:scale-[1.02] focus:ring-2 focus:ring-kenyan-green/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-kenyan-cream/60">
            Remembered your password?{' '}
            <Link href="/auth/login" className="text-kenyan-gold hover:text-kenyan-cream font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
