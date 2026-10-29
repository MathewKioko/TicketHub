'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatDateTime } from '@/lib/format'

type ScanOutcome =
  | { kind: 'accepted'; name?: string; event?: string; at?: string; ticketId?: string }
  | { kind: 'used'; at?: string; ticketId?: string }
  | { kind: 'invalid'; message: string }

interface ScanResponse {
  success?: boolean
  message?: string
  error?: string
  ticket?: {
    id?: string
    status?: string
    checkedInAt?: string
    user?: { name?: string }
    event?: { title?: string }
  }
}

export default function ScannerPage() {
  const { user, loading } = useAuth()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [history, setHistory] = useState<{ id: string; name?: string; at: string }[]>([])

  const canScan = user?.role === 'ORGANIZER'

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = code.trim()
    if (!value || busy) return

    setBusy(true)
    setOutcome(null)

    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData: value }),
      })
      const data = (await response.json()) as ScanResponse

      if (!response.ok) {
        setOutcome({ kind: 'invalid', message: data.error ?? 'That code could not be checked.' })
        return
      }

      if (data.success && data.ticket) {
        setOutcome({
          kind: 'accepted',
          name: data.ticket.user?.name,
          event: data.ticket.event?.title,
          at: data.ticket.checkedInAt,
          ticketId: data.ticket.id,
        })
        setHistory((current) => [
          { id: data.ticket?.id ?? value.slice(-8), name: data.ticket?.user?.name, at: new Date().toISOString() },
          ...current.slice(0, 4),
        ])
        setCode('')
        return
      }

      if (data.error?.toLowerCase().includes('already')) {
        setOutcome({ kind: 'used', at: data.ticket?.checkedInAt, ticketId: data.ticket?.id })
        return
      }

      setOutcome({ kind: 'invalid', message: data.error ?? data.message ?? 'This ticket cannot be admitted.' })
    } catch {
      setOutcome({ kind: 'invalid', message: 'The server could not be reached. Do not admit on this result.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FocusedHeader rightLabel="Workspace" rightHref="/dashboard/organizer" />

      <div className="mx-auto max-w-[720px] px-5 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Door check-in</p>
        <h1 className="display mt-2 text-[38px] leading-none">Scan tickets</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Enter the ticket code shown under the QR, or the full ticket link. Each ticket is admitted
          once.
        </p>

        {loading ? null : !user ? (
          <Notice tone="info" className="mt-6" title="Sign in to scan">
            Only the organizer of an event can admit its guests.{' '}
            <Link href="/auth/login?next=%2Fscanner" className="underline decoration-line underline-offset-2">
              Sign in
            </Link>
            .
          </Notice>
        ) : !canScan ? (
          <Notice tone="warning" className="mt-6" title="Scanner needs the organizer account">
            Your account role is <span className="font-medium">{user.role}</span>. Admittance is
            restricted to the organizer who owns the event.{' '}
            <Link
              href="/auth/login?next=%2Fscanner"
              className="underline decoration-line underline-offset-2"
            >
              Sign in with that account
            </Link>
            .
            <span className="mt-1 block">
              Door-staff accounts are not yet tied to a specific event, so they cannot admit guests
              on their own.
            </span>
          </Notice>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-6 border border-ink bg-paper p-5">
              <label htmlFor="ticket-code" className="block text-xs font-medium">
                Ticket code or link
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="ticket-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoFocus
                  inputMode="text"
                  placeholder="e.g. 3f9c2a… or https://…/tickets/…"
                  className="field flex-1"
                />
                <Button type="submit" disabled={busy || code.trim().length === 0}>
                  {busy ? 'Checking…' : 'Admit ticket'}
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate">
                Camera scanning is not enabled in this build — no QR decoder is bundled. Manual entry
                uses the same admission rules as a scan.
              </p>
            </form>

            <section aria-live="polite" className="mt-6">
              {outcome?.kind === 'accepted' ? (
                <div className="border border-[#C9DCD1] bg-[#F0F6F2] px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">Admitted</p>
                  <p className="display mt-1 text-[26px] leading-tight">{outcome.name ?? 'Ticket holder'}</p>
                  <p className="mt-1 text-sm text-slate">
                    {outcome.event ?? 'Event'} · {formatDateTime(outcome.at)}
                  </p>
                  <p className="tnum mt-3 text-xs text-slate">{outcome.ticketId}</p>
                </div>
              ) : null}

              {outcome?.kind === 'used' ? (
                <div className="border border-[#E6D3B3] bg-[#FBF4E7] px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5B3B0A]">
                    Already admitted
                  </p>
                  <p className="mt-1 text-sm text-[#5B3B0A]">
                    This ticket was scanned at {formatDateTime(outcome.at)}. Do not admit it again.
                  </p>
                </div>
              ) : null}

              {outcome?.kind === 'invalid' ? (
                <div className="border border-[#E3C4C0] bg-[#FBF0EE] px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-crimson">
                    Not admitted
                  </p>
                  <p className="mt-1 text-sm text-[#7A1A15]">{outcome.message}</p>
                </div>
              ) : null}
            </section>

            {history.length > 0 ? (
              <section className="mt-8">
                <h2 className="border-b border-line pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
                  This session
                </h2>
                {history.map((entry) => (
                  <div key={`${entry.id}-${entry.at}`} className="flex items-center justify-between border-b border-line py-3 text-sm">
                    <span>{entry.name ?? 'Ticket holder'}</span>
                    <span className="tnum text-xs text-slate">{formatDateTime(entry.at)}</span>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
