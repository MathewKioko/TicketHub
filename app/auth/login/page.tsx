'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { useAuth } from '@/components/providers/AuthProvider'

function safeNext(value: string | null): string | null {
  if (!value) return null
  return value.startsWith('/') && !value.startsWith('//') ? value : null
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, refresh, loading: authLoading } = useAuth()

  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    router.replace(next ?? dashboardFor(user.role))
  }, [authLoading, user, next, router])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setNeedsVerification(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await response.json()) as { error?: string; user?: { role?: string } }

      if (!response.ok) {
        if (response.status === 403) setNeedsVerification(true)
        setError(
          response.status === 401
            ? 'That email and password don’t match an account.'
            : response.status === 423
              ? 'Too many failed attempts. Try again in a little while.'
              : data.error ?? 'Sign in failed. Try again.'
        )
        return
      }

      const signedIn = await refresh()
      router.replace(next ?? dashboardFor(signedIn?.role ?? data.user?.role))
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-66px)] grid-cols-1 lg:grid-cols-[1fr_44%]">
      <div className="flex flex-col px-5 py-10 sm:px-10 lg:px-16">
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[400px] lg:mx-auto">
            <h1 className="display text-[40px] leading-[1.02]">Sign in</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Your tickets, QR codes and order history in one place.
            </p>

            {next?.startsWith('/checkout') ? (
              <Notice tone="info" className="mt-6">
                Sign in to finish this purchase. Your tickets and quantity are kept.
              </Notice>
            ) : null}

            {error ? (
              <Notice tone="danger" className="mt-6">
                {error}
                {needsVerification ? (
                  <>
                    {' '}
                    <Link href="/auth/verify" className="underline decoration-line underline-offset-2">
                      Enter your verification code
                    </Link>
                    .
                  </>
                ) : null}
              </Notice>
            ) : null}

            <form onSubmit={onSubmit} className="mt-7 space-y-5">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="password" className="block text-xs font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-medium text-slate hover:text-ink"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field mt-1.5"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-4 text-[13px] text-slate">
              New to TicketHub?{' '}
              <Link
                href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : '/auth/signup'}
                className="link-quiet text-ink"
              >
                Create an account
              </Link>
            </p>

            <div className="mt-10 border-t border-line pt-5">
              <p className="text-[13px] text-slate">
                Running events?{' '}
                <Link href="/become-organizer" className="link-quiet text-ink">
                  Apply for an organizer account
                </Link>
              </p>
              <p className="mt-2 text-xs text-slate">Organizer accounts are reviewed before publishing.</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
      </div>

      <div className="hidden bg-ink text-bone lg:flex lg:flex-col">
        <div className="h-[58%] w-full overflow-hidden">
          <img
            src="https://images.pexels.com/photos/4823687/pexels-photo-4823687.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Performer singing into a microphone, photo by Klang Lumpikanon on Pexels"
            className="h-full w-full object-cover opacity-90"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between px-10 py-8">
          <div>
            <p className="display max-w-[26ch] text-[26px] leading-[1.2]">
              Your ticket is the QR code. Nothing to print, nothing to collect.
            </p>
            <ul className="mt-6 space-y-2.5 text-[13px] text-[#C9C2B6]">
              <li>Every ticket saved to your wallet at payment</li>
              <li>Receipts and calendar entries with one tap</li>
              <li>Order history you can check at the gate</li>
            </ul>
          </div>
          <p className="text-[11px] text-[#8F8778]">Payments in KES by Paystack and M-Pesa</p>
        </div>
      </div>
    </div>
  )
}

function dashboardFor(role?: string): string {
  if (role === 'ADMIN') return '/dashboard/admin'
  if (role === 'ORGANIZER' || role === 'EVENT_OWNER') return '/dashboard/organizer'
  if (role === 'PENDING_ORGANIZER') return '/become-organizer'
  return '/dashboard/attendee'
}

export default function LoginPage() {
  return (
    <>
      <FocusedHeader rightLabel="Browse events" rightHref="/events" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[368px] px-5 py-14">
            <h1 className="display text-[40px] leading-[1.02]">Sign in</h1>
            <p className="mt-3 text-sm text-slate">Loading…</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </>
  )
}
