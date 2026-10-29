'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/components/providers/AuthProvider'
import { asDate, formatEventStamp, formatMoney, formatNumber, isPast, pluralise } from '@/lib/format'
import { ticketStatus } from '@/lib/status'
import type { TicketView } from '@/lib/types'

interface TicketGroup {
  key: string
  event: TicketView['event']
  tickets: TicketView[]
  start: number
}

function groupTickets(tickets: TicketView[]): TicketGroup[] {
  const map = new Map<string, TicketGroup>()
  for (const ticket of tickets) {
    const eventId = ticket.event?.id ?? 'unknown'
    const start = asDate(ticket.event?.date)?.getTime() ?? 0
    const existing = map.get(eventId)
    if (existing) {
      existing.tickets.push(ticket)
    } else {
      map.set(eventId, { key: eventId, event: ticket.event, tickets: [ticket], start })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.start - b.start)
}

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadTickets(): Promise<TicketView[]> {
      const response = await fetch('/api/tickets/my', { cache: 'no-store' })
      if (!response.ok) throw new Error('Your tickets could not be loaded.')
      const data = (await response.json()) as { tickets?: TicketView[] }
      return data.tickets ?? []
    }

    async function run() {
      try {
        const first = await loadTickets()
        if (cancelled) return
        setTickets(first)

        // Reconcile anything Paystack already settled but the browser never saw.
        if (first.some((ticket) => ticket.status === 'PENDING')) {
          try {
            await fetch('/api/tickets/verify-all-pending', { method: 'POST' })
            const second = await loadTickets()
            if (!cancelled) setTickets(second)
          } catch {
            // Reconciliation is best-effort; the list below is still accurate.
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Your tickets could not be loaded.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const groups = useMemo(() => groupTickets(tickets), [tickets])

  const awaiting = groups.filter((group) => group.tickets.some((ticket) => ticket.status === 'PENDING'))
  const settled = groups.filter((group) => !group.tickets.some((ticket) => ticket.status === 'PENDING'))
  const past = settled.filter(
    (group) => isPast(group.event?.date) || group.tickets.every((ticket) => ticket.status === 'CHECKED_IN')
  )
  const upcoming = settled.filter((group) => !past.includes(group))
  const nextUp = upcoming[0] ?? null
  const later = upcoming.slice(1)

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-[1040px] px-5 py-14 sm:px-8">
        <h1 className="display text-[40px] leading-none">My tickets</h1>
        <Notice tone="info" className="mt-6" title="Sign in to see your tickets">
          Tickets are tied to the account that bought them.{' '}
          <Link href="/auth/login?next=%2Fdashboard%2Fattendee" className="underline decoration-line underline-offset-2">
            Sign in
          </Link>
          .
        </Notice>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[40px] leading-none sm:text-[46px]">My tickets</h1>
          <p className="mt-2.5 text-sm text-slate">
            Admission passes and past bookings, grouped by the date you attend.
          </p>
        </div>
        <Link href="/events" className="link-quiet text-[13px] font-medium">
          Browse events →
        </Link>
      </div>

      {error ? (
        <Notice tone="danger" className="mt-6" title="Tickets could not be loaded">
          {error}
        </Notice>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {!loading && groups.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No tickets yet"
            description="When you buy a ticket it lands here immediately, with the QR code you show at the gate."
            action={
              <Link href="/events" className="bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft">
                Find an event
              </Link>
            }
          />
        </div>
      ) : null}

      {!loading && nextUp ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Next up</h2>
          <article className="mt-3 border border-ink">
            <div className="flex flex-col sm:flex-row">
              <div className="h-[180px] w-full shrink-0 overflow-hidden bg-shell sm:h-[196px] sm:w-[264px]">
                {nextUp.event?.imageUrl ? (
                  <img src={nextUp.event.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-flame">
                    {formatEventStamp(nextUp.event?.date)}
                  </p>
                  <h3 className="display mt-2 text-[26px] leading-tight">{nextUp.event?.title}</h3>
                  <p className="mt-1.5 text-[13px] text-slate">{nextUp.event?.venue}</p>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-center gap-4 text-[13px] text-slate">
                    <span className="tnum">{pluralise(nextUp.tickets.length, 'ticket')}</span>
                    <span aria-hidden className="h-3 w-px bg-line" />
                    <StatusBadge status={ticketStatus(nextUp.tickets[0]?.status)} />
                  </div>
                  <Link
                    href={`/tickets/${nextUp.tickets[0]?.id}`}
                    className="bg-ink px-5 py-2.5 text-[13px] font-medium text-bone hover:bg-ink-soft"
                  >
                    View tickets
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {!loading && later.length > 0 ? (
        <section className="mt-9">
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Later</h2>
            <span className="text-xs text-slate">
              {formatNumber(later.length)} {later.length === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          {later.map((group) => (
            <Link
              key={group.key}
              href={`/tickets/${group.tickets[0]?.id}`}
              className="group flex items-center gap-4 border-b border-line py-4 hover:bg-shell/60"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden bg-shell">
                {group.event?.imageUrl ? (
                  <img src={group.event.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-slate">{formatEventStamp(group.event?.date)}</p>
                <p className="display mt-0.5 truncate text-[20px] leading-tight">{group.event?.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-slate">{group.event?.venue}</p>
              </div>
              <span className="hidden whitespace-nowrap text-right text-[13px] text-slate sm:block">
                {pluralise(group.tickets.length, 'ticket')}
              </span>
              <span
                aria-hidden
                className="w-4 text-right text-[15px] text-slate transition-transform group-hover:translate-x-1 group-hover:text-flame"
              >
                →
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {!loading && awaiting.length > 0 ? (
        <section className="mt-9">
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Awaiting payment</h2>
            <span className="text-xs text-slate">Not valid for entry yet</span>
          </div>
          {awaiting.map((group) => (
            <div
              key={group.key}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4"
            >
              <div className="min-w-0">
                <p className="display text-[19px] leading-tight">{group.event?.title}</p>
                <p className="mt-0.5 text-xs text-slate">
                  {formatEventStamp(group.event?.date)} · {pluralise(group.tickets.length, 'ticket')} ·{' '}
                  {formatMoney(group.tickets.reduce((sum, ticket) => sum + (ticket.price ?? 0), 0))}
                </p>
              </div>
              <Link
                href={`/tickets/${group.tickets[0]?.id}`}
                className="border border-ink px-4 py-2 text-[13px] font-medium hover:bg-ink hover:text-bone"
              >
                Check status
              </Link>
            </div>
          ))}
          <p className="pt-3 text-xs leading-relaxed text-slate">
            Paystack has not confirmed these payments yet. If money left your account, open the ticket
            to check its status — do not pay again.
          </p>
        </section>
      ) : null}

      {!loading && past.length > 0 ? (
        <section className="mt-9">
          <div className="flex items-baseline justify-between border-b border-line pb-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Past</h2>
            <span className="text-xs text-slate">
              {formatNumber(past.length)} {past.length === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          {past.map((group) => (
            <Link
              key={group.key}
              href={`/tickets/${group.tickets[0]?.id}`}
              className="group flex items-center gap-4 border-b border-line py-3.5 hover:bg-shell/60"
            >
              <div className="w-[76px] shrink-0 text-[12px] text-slate">
                {asDate(group.event?.date)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">{group.event?.title}</p>
                <p className="mt-0.5 text-xs text-slate">
                  {group.event?.venue} · {pluralise(group.tickets.length, 'ticket')}
                </p>
              </div>
              <StatusBadge status={ticketStatus(group.tickets[0]?.status)} />
              <span
                aria-hidden
                className="w-4 text-right text-[14px] text-slate transition-transform group-hover:translate-x-1 group-hover:text-flame"
              >
                →
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {!loading && groups.length > 0 ? (
        <p className="mt-8 text-xs text-slate">
          Each ticket is scanned once at the gate. If a ticket will not scan, show the QR code to venue
          staff.
        </p>
      ) : null}
    </div>
  )
}
