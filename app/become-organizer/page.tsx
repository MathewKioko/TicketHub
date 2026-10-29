'use client'

import Link from 'next/link'
import { useEffect, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/components/providers/AuthProvider'
import { canOrganise } from '@/lib/status'

export default function BecomeOrganizerPage() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setDone] = useState(false)
  const [alreadyHasAccess, setAlreadyHasAccess] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/request-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      })
      const data = (await response.json()) as { error?: string; status?: string; alreadyHasAccess?: boolean }
      if (!response.ok) throw new Error(data.error ?? 'The request could not be sent.')
      if (data.status === 'already_has_access' || data.alreadyHasAccess) {
        setAlreadyHasAccess(true)
      }
      await refresh()
      setDone(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The request could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (alreadyHasAccess || (user?.role && canOrganise(user.role))) {
      const timer = setTimeout(() => {
        router.push('/dashboard/organizer')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [alreadyHasAccess, user?.role, router])

  const pending = submitted || user?.role === 'PENDING_ORGANIZER'

  return (
    <div className="bg-bone">
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <h1 className="display max-w-[16ch] text-[44px] leading-[1.02] lg:text-[52px]">
              Sell tickets without the spreadsheet.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-slate">
              Publish an event, take payment by card or M-Pesa, admit guests with a QR scan, and see
              what each event earned. Organizer accounts are reviewed before you can publish.
            </p>

            <dl className="mt-9 divide-y divide-line border-y border-line">
              <div className="grid grid-cols-[150px_1fr] gap-4 py-3.5">
                <dt className="text-[13px] font-medium">Payments</dt>
                <dd className="text-sm text-slate">Paystack in KES; card and M-Pesa channels.</dd>
              </div>
              <div className="grid grid-cols-[150px_1fr] gap-4 py-3.5">
                <dt className="text-[13px] font-medium">Admission</dt>
                <dd className="text-sm text-slate">One QR per ticket, scanned once at the gate.</dd>
              </div>
              <div className="grid grid-cols-[150px_1fr] gap-4 py-3.5">
                <dt className="text-[13px] font-medium">Payouts</dt>
                <dd className="text-sm text-slate">
                  Settled to your bank account through a Paystack subaccount.
                </dd>
              </div>
            </dl>
          </div>

          <div className="self-start border border-ink bg-paper p-6">
            {loading ? (
              <p className="text-sm text-slate">Loading your account…</p>
            ) : !user ? (
              <>
                <h2 className="display text-[26px] leading-tight">Start with an account</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  You need a TicketHub account to apply. It takes a minute, and your tickets live in
                  the same wallet.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/auth/signup?role=organizer"
                    className="bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft"
                  >
                    Create an account
                  </Link>
                  <Link
                    href="/auth/login?next=%2Fbecome-organizer"
                    className="border border-ink px-5 py-3 text-[13px] font-medium hover:bg-ink hover:text-bone"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            ) : (alreadyHasAccess || canOrganise(user.role)) ? (
              <>
                <div className="flex flex-col items-center py-4">
                  <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h2 className="display text-[26px] leading-tight text-green-700 mt-4">
                    You're already an organizer
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate">
                    Your account is verified and active. You'll be redirected to your organizer
                    workspace now.
                  </p>
                </div>
                <div className="mt-5">
                  <Button
                    onClick={() => void router.push('/dashboard/organizer')}
                    className="w-full"
                  >
                    Open organizer workspace
                  </Button>
                </div>
              </>
            ) : pending ? (
              <>
                <h2 className="display text-[26px] leading-tight">Application submitted</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  An administrator reviews organizer applications. You cannot publish events until it
                  is approved — we’ll keep your account as it is in the meantime.
                </p>
                <Notice tone="warning" className="mt-5" title="Status: pending review">
                  Nothing else is needed from you right now.
                </Notice>
                <Link href="/dashboard/attendee" className="mt-5 inline-block link-quiet text-[13px]">
                  Go to my tickets
                </Link>
              </>
            ) : (
              <>
                <h2 className="display text-[26px] leading-tight">Apply to become an organizer</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  Tell us what you run. An administrator reviews the request before publishing is
                  enabled.
                </p>

                {error ? (
                  <Notice tone="danger" className="mt-5">
                    {error}
                  </Notice>
                ) : null}

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                  <Textarea
                    label="What kind of events do you run?"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    placeholder="Live music sessions, monthly, 200–400 capacity…"
                  />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Submit application'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
