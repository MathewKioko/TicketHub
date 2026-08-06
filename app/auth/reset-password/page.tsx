'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Lock, ArrowRight, CheckCircle, XCircle } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 2000)
      } else {
        setError(data.error || 'Failed to reset password')
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
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-kenyan-cream/60">Enter your new password</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-kenyan-green/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-kenyan-green" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Password Reset Successful!</h2>
            <p className="text-kenyan-cream/70 mb-6">
              Your password has been updated. Redirecting you to login...
            </p>
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-kenyan-green hover:scale-[1.02] transition-all duration-200"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <>
            {!token && (
              <div className="bg-kenyan-red/20 border border-kenyan-red/30 text-kenyan-red px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Invalid or missing reset token. Please request a new password reset link.</span>
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-kenyan-red/20 border border-kenyan-red/30 text-kenyan-red px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-kenyan-cream mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                      placeholder="Enter new password (min 8 chars)"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-kenyan-cream mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
                    <input
                      type="password"
                      id="confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-kenyan-black/50 border border-white/10 rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
                      placeholder="Confirm new password"
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
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-xl text-kenyan-cream/60">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
