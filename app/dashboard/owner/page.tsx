'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { formatEventStamp, formatMoney, formatNumber } from '@/lib/format'
import { eventStatus } from '@/lib/status'

interface OwnerEvent {
  id: string
  title: string
  date: string
  venue: string
  status: string
  basePrice: number
  _count?: { tickets?: number }
}

interface OwnerDashboard {
  stats?: {
    totalEvents?: number
    publishedEvents?: number
    totalTicketsSold?: number
    totalRevenue?: number
    pendingPayouts?: number
  }
  events?: OwnerEvent[]
}

export default function OwnerDashboardPage() {
  const [data, setData] = useState<OwnerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/owner/dashboard', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('This account does not have organizer access.')
      }
      if (!response.ok) throw new Error('Your dashboard could not be loaded.')
      setData((await response.json()) as OwnerDashboard)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Your dashboard could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = data?.stats
  const events = data?.events ?? []

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[44px]">Owner overview</h1>
          <p className="mt-2.5 text-sm text-slate">Revenue, events and payouts for your account.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/organizer/settings" className="link-quiet text-[13px]">
            Payout settings
          </Link>
          <Link
            href="/dashboard/organizer"
            className="bg-ink px-5 py-2.5 text-[13px] font-medium text-bone hover:bg-ink-soft"
          >
            Manage events
          </Link>
        </div>
      </div>

      {error ? (
        <Notice
          tone="danger"
          className="mt-6"
          title="Dashboard unavailable"
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
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 border-y border-line md:grid-cols-4">
            <div className="border-b border-line py-5 pr-4 md:border-b-0 md:border-r md:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Events</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.totalEvents ?? events.length)}
              </p>
            </div>
            <div className="border-b border-line py-5 pl-4 md:border-b-0 md:border-r md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Published</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.publishedEvents ?? 0)}
              </p>
            </div>
            <div className="py-5 pr-4 md:border-r md:pr-6 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Tickets sold</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.totalTicketsSold ?? 0)}
              </p>
            </div>
            <div className="py-5 pl-4 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Revenue</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatMoney(stats?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Your events</h2>
              <span className="text-xs text-slate">{formatNumber(events.length)} total</span>
            </div>

            {events.length === 0 ? (
              <p className="mt-4 text-sm text-slate">
                No events yet.{' '}
                <Link href="/events/create" className="link-quiet text-ink">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Event</Th>
                  <Th>Status</Th>
                  <Th align="right">Sold</Th>
                  <Th align="right"> </Th>
                </THead>
                <TBody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-line align-top">
                      <Td>
                        <p className="display text-[18px] leading-tight">{event.title}</p>
                        <p className="tnum mt-1 text-xs text-slate">
                          {formatEventStamp(event.date)} · {event.venue}
                        </p>
                      </Td>
                      <Td>
                        <StatusBadge status={eventStatus(event.status)} />
                      </Td>
                      <Td align="right">
                        <span className="tnum">{formatNumber(event._count?.tickets ?? 0)}</span>
                      </Td>
                      <Td align="right">
                        <Link href={`/events/${event.id}/manage`} className="text-[13px] font-medium hover:text-flame">
                          Manage →
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
            <p className="mt-3 text-xs text-slate">
              Revenue figures read from confirmed tickets. Payout records are created by Paystack
              settlements.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
