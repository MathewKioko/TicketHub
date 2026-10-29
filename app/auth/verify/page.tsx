'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'

function VerifyForm() {
  const params = useSearchParams()
  const next = params.get('next')
  const [token, setToken] = useState(params.get('token') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'That code could not be verified.')
      setDone(true)
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'That code could not be verified.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-[420px]">
        <h1 className="display text-[38px] leading-[1.04]">Email verified</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Your account is ready. Sign in to buy tickets or open your wallet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={loginHref} className="bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft">
            Sign in
          </Link>
          <Link href="/events" className="border border-ink px-5 py-3 text-[13px] font-medium hover:bg-ink hover:text-bone">
            Browse events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="display text-[40px] leading-[1.02]">Verify your email</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        Enter the verification code from your signup. Ticket sales need a verified address so your
        tickets can be issued.
      </p>

      {error ? (
        <Notice tone="danger" className="mt-6">
          {error}
        </Notice>
      ) : null}

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <Input
          label="Verification code"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          hint="Paste the code exactly as it was issued."
          placeholder="e3f19c…"
          required
        />
        <Button type="submit" className="w-full" disabled={submitting || token.trim().length === 0}>
          {submitting ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <p className="mt-4 text-[13px] text-slate">
        Codes expire 24 hours after signup. If yours has expired, ask an administrator to resend it.
      </p>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <>
      <FocusedHeader rightLabel="Sign in" rightHref="/auth/login" />
      <div className="mx-auto max-w-[420px] px-5 py-16">
        <Suspense fallback={<p className="text-sm text-slate">Loading…</p>}>
          <VerifyForm />
        </Suspense>
      </div>
    </>
  )
}
