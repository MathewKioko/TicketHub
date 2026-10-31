'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'

function SignupForm() {
  const params = useSearchParams()
  const next = params.get('next')
  const isOrganizerIntent = params.get('role') === 'organizer'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      })
      const data = (await response.json()) as {
        error?: string
      }
      if (!response.ok) throw new Error(data.error ?? 'The account could not be created.')
      setDone(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The account could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

    if (done) {
    const verifyHref = next
      ? `/auth/verify?next=${encodeURIComponent(next)}`
      : '/auth/verify'

    return (
      <div className="w-full max-w-[420px]">
        <h1 className="display text-[38px] leading-[1.04]">Check your email to finish</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          We created your account. One step remains: confirm the email address so tickets can be
          issued to it.
        </p>

        <Notice tone="success" className="mt-6" title="Account created">
          A 6-digit verification code has been sent to your email. Enter it on the verification page.
        </Notice>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={verifyHref} className="bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft">
            Verify my email
          </Link>
          <Link href="/auth/login" className="border border-ink px-5 py-3 text-[13px] font-medium hover:bg-ink hover:text-bone">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[380px]">
      <h1 className="display text-[40px] leading-[1.02]">Create an account</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        {isOrganizerIntent
          ? 'An account is the first step. Organizer access is reviewed after you apply.'
          : 'Buy tickets, keep them in one wallet, and show the QR at the gate.'}
      </p>

      {error ? (
        <Notice tone="danger" className="mt-6">
          {error}
        </Notice>
      ) : null}

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <Input
          label="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          autoComplete="name"
          placeholder="Amina Wanjiru"
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          autoComplete="tel"
          hint="Optional. Used for M-Pesa payments."
          placeholder="+254 7xx xxx xxx"
        />

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="signup-password" className="block text-xs font-medium">
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
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            autoComplete="new-password"
            minLength={8}
            required
            className="field mt-1.5"
            placeholder="At least 8 characters"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-[13px] text-slate">
        Already have an account?{' '}
        <Link href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'} className="link-quiet text-ink">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <>
      <FocusedHeader rightLabel="Browse events" rightHref="/events" />
      <div className="grid min-h-[calc(100vh-66px)] grid-cols-1 lg:grid-cols-[1fr_44%]">
        <div className="flex flex-col px-5 py-10 sm:px-10 lg:px-16">
          <div className="flex flex-1 items-center">
            <Suspense fallback={<p className="text-sm text-slate">Loading…</p>}>
              <SignupForm />
            </Suspense>
          </div>
          <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
        </div>
        <div className="hidden bg-ink lg:flex lg:flex-col lg:justify-end lg:p-10">
          <p className="display max-w-[24ch] text-[26px] leading-[1.2] text-bone">
            One wallet for every ticket you buy.
          </p>
          <p className="mt-4 max-w-[34ch] text-[13px] leading-relaxed text-[#C9C2B6]">
            QR codes stay available at the gate, receipts download in one tap, and past bookings remain
            in your history.
          </p>
        </div>
      </div>
    </>
  )
}
