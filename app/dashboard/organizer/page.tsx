'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { useAuth } from '@/components/providers/AuthProvider'
import { asDate, formatEventStamp, formatMoney, formatNumber } from '@/lib/format'
import { ORGANIZER_TABS } from '@/lib/site'
import { eventStatus, isAdmin } from '@/lib/status'

interface OrganizerEvent {
  id: string
  title: string
  date: string
  venue: string
  status: string
  basePrice: number
  totalTickets: number
  _count?: { tickets?: number }
}

interface DashboardStats {
  totalEvents?: number
  totalRevenue?: number
  totalTickets?: number
  upcomingEvents?: number
}

export default function OrganizerDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventsResponse, statsResponse] = await Promise.all([
        fetch('/api/events?organizerId=me', { cache: 'no-store' }),
        fetch('/api/dashboard/stats', { cache: 'no-store' }),
      ])

      if (eventsResponse.status === 401) throw new Error('Sign in again to see your events.')
      if (!eventsResponse.ok) throw new Error('Your events could not be loaded.')

      const eventsData = (await eventsResponse.json()) as { events?: OrganizerEvent[] }
      setEvents(eventsData.events ?? [])

      if (statsResponse.ok) {
        setStats((await statsResponse.json()) as DashboardStats)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Your events could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    void load()
  }, [authLoading, user, load])

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-[1000px] px-5 py-16 sm:px-8">
        <h1 className="display text-[38px] leading-none">Organizer workspace</h1>
        <Notice tone="info" className="mt-6" title="Sign in to continue">
          <Link href="/auth/login?next=%2Fdashboard%2Forganizer" className="underline decoration-line underline-offset-2">
            Sign in
          </Link>{' '}
          with an organizer account to manage events.
        </Notice>
      </div>
    )
  }

  const now = Date.now()
  const upcoming = events.filter((event) => (asDate(event.date)?.getTime() ?? 0) >= now)
  const finished = events.filter((event) => (asDate(event.date)?.getTime() ?? 0) < now)

  return (
    <>
      <WorkspaceTabs tabs={ORGANIZER_TABS} context={isAdmin(user?.role) ? 'Admin view' : 'Organizer workspace'} />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[38px] leading-none sm:text-[44px]">Your events</h1>
            <p className="mt-2.5 text-sm text-slate">
              {user?.name ?? 'Organizer'} · {formatNumber(events.length)} events · Nairobi
            </p>
          </div>
          <Link
            href="/events/create"
            className="bg-ink px-5 py-2.5 text-[13px] font-medium text-bone hover:bg-ink-soft"
          >
            Create event
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 border-y border-line md:grid-cols-4">
          <div className="border-b border-line py-5 pr-4 md:border-b-0 md:border-r md:pr-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Events</p>
            <p className="display tnum mt-2 text-[30px] leading-none">
              {formatNumber(stats?.totalEvents ?? events.length)}
            </p>
            <p className="mt-1.5 text-xs text-slate">Created on TicketHub</p>
          </div>
          <div className="border-b border-line py-5 pl-4 md:border-b-0 md:border-r md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Tickets sold</p>
            <p className="display tnum mt-2 text-[30px] leading-none">
              {formatNumber(stats?.totalTickets ?? 0)}
            </p>
            <p className="mt-1.5 text-xs text-slate">Confirmed and admitted</p>
          </div>
          <div className="py-5 pr-4 md:border-r md:pr-6 md:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Gross sales</p>
            <p className="display tnum mt-2 text-[30px] leading-none">
              {formatMoney(stats?.totalRevenue ?? 0)}
            </p>
            <p className="mt-1.5 text-xs text-slate">Before the platform fee</p>
          </div>
          <div className="py-5 pl-4 md:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Upcoming</p>
            <p className="display tnum mt-2 text-[30px] leading-none">
              {formatNumber(stats?.upcomingEvents ?? upcoming.length)}
            </p>
            <p className="mt-1.5 text-xs text-slate">Events still to come</p>
          </div>
        </div>

        {error ? (
          <Notice
            tone="danger"
            className="mt-6"
            title="Events could not be loaded"
            action={
              <Button size="sm" variant="secondary" onClick={() => void load()}>
                Try again
              </Button>
            }
          >
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {!loading && !error && events.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No events yet"
              description="Publish your first event to start selling tickets. You can keep it as a draft until the details are right."
              action={
                <Link href="/events/create" className="bg-ink px-5 py-3 text-[13px] font-medium text-bone">
                  Create an event
                </Link>
              }
            />
          </div>
        ) : null}

        {!loading && upcoming.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Upcoming &amp; live</h2>
              <span className="text-xs text-slate">{formatNumber(upcoming.length)} events</span>
            </div>
            <Table>
              <THead>
                <Th>Event</Th>
                <Th>Status</Th>
                <Th align="right">Sold</Th>
                <Th align="right">Price</Th>
                <Th align="right"> </Th>
              </THead>
              <TBody>
                {upcoming.map((event) => {
                  const sold = event._count?.tickets ?? 0
                  return (
                    <tr key={event.id} className="border-b border-line align-top">
                      <Td>
                        <p className="display text-[19px] leading-tight">{event.title}</p>
                        <p className="tnum mt-1 text-xs text-slate">
                          {formatEventStamp(event.date)} · {event.venue}
                        </p>
                      </Td>
                      <Td>
                        <StatusBadge status={eventStatus(event.status)} />
                      </Td>
                      <Td align="right">
                        <span className="tnum">{formatNumber(sold)}</span>
                        {event.totalTickets > 0 ? (
                          <span className="tnum text-slate"> / {formatNumber(event.totalTickets)}</span>
                        ) : null}
                      </Td>
                      <Td align="right">
                        <span className="tnum">{formatMoney(event.basePrice)}</span>
                      </Td>
                      <Td align="right">
                        <Link
                          href={`/events/${event.id}/manage`}
                          className="text-[13px] font-medium hover:text-flame"
                        >
                          Manage →
                        </Link>
                      </Td>
                    </tr>
                  )
                })}
              </TBody>
            </Table>
            <p className="mt-3 text-xs text-slate">
              Sold counts confirmed and admitted tickets. Gross is ticket revenue before the platform
              fee; payouts settle through Paystack.
            </p>
          </section>
        ) : null}

        {!loading && finished.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-baseline justify-between border-b border-line pb-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Finished</h2>
              <span className="text-xs text-slate">{formatNumber(finished.length)} events</span>
            </div>
            {finished.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5"
              >
                <div>
                  <p className="display text-[18px] leading-tight">{event.title}</p>
                  <p className="tnum mt-0.5 text-xs text-slate">
                    {formatEventStamp(event.date)} · {event.venue}
                  </p>
                </div>
                <div className="flex items-center gap-8 text-xs text-slate">
                  <span className="tnum">{formatNumber(event._count?.tickets ?? 0)} sold</span>
                  <Link href={`/events/${event.id}/manage`} className="text-[13px] font-medium text-ink hover:text-flame">
                    Report →
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </>
  )
}
