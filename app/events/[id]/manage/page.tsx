'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { formatDateTime, formatEventStamp, formatMoney, formatNumber } from '@/lib/format'
import { eventStatus } from '@/lib/status'

interface ManagedEvent {
  id: string
  title: string
  date: string
  venue: string
  status: string
  basePrice: number
  totalTickets?: number
  _count?: { tickets?: number; checkins?: number }
}

interface CheckInRow {
  id: string
  checkedInAt: string
  ticket?: {
    id?: string
    ticketCode?: string
    user?: { name?: string; email?: string }
  }
}

export default function EventManagePage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<ManagedEvent | null>(null)
  const [checkIns, setCheckins] = useState<CheckInRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/events/${params.id}`, { cache: 'no-store' }),
        fetch(`/api/events/${params.id}/attendance`, { cache: 'no-store' }),
      ])

      if (!eventResponse.ok) throw new Error('This event could not be loaded.')
      const eventData = (await eventResponse.json()) as { event?: ManagedEvent }
      setEvent(eventData.event ?? null)

      if (attendanceResponse.ok) {
        const attendance = (await attendanceResponse.json()) as { checkIns?: CheckInRow[] }
        setCheckins(attendance.checkIns ?? [])
      } else if (attendanceResponse.status === 403 || attendanceResponse.status === 401) {
        setCheckins([])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'This event could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    void load()
  }, [load])

  const sold = event?._count?.tickets ?? 0
  const admitted = checkIns.length
  const attendanceRate = sold > 0 ? Math.round((admitted / sold) * 100) : 0

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/dashboard/organizer" className="group flex items-center gap-2 text-[13px] text-slate hover:text-ink">
          <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Your events
        </Link>
        <div className="flex items-center gap-4 text-[13px]">
          <Link href={`/events/${params.id}`} className="link-quiet">
            Public page
          </Link>
          <Link href="/scanner" className="border border-ink px-4 py-2 font-medium hover:bg-ink hover:text-bone">
            Open scanner
          </Link>
        </div>
      </div>

      {error ? (
        <Notice
          tone="danger"
          className="mt-6"
          title="Event unavailable"
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
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : event ? (
        <>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display text-[38px] leading-tight sm:text-[44px]">{event.title}</h1>
              <p className="tnum mt-2 text-sm text-slate">
                {formatEventStamp(event.date)} · {event.venue} · {formatMoney(event.basePrice)} per ticket
              </p>
            </div>
            <StatusBadge status={eventStatus(event.status)} outline />
          </div>

          <div className="mt-8 grid grid-cols-2 border-y border-line md:grid-cols-4">
            <div className="border-b border-line py-5 pr-4 md:border-b-0 md:border-r md:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Tickets sold</p>
              <p className="display tnum mt-2 text-[30px] leading-none">{formatNumber(sold)}</p>
              <p className="tnum mt-1.5 text-xs text-slate">
                {event.totalTickets ? `of ${formatNumber(event.totalTickets)} capacity` : 'Capacity not set'}
              </p>
            </div>
            <div className="border-b border-line py-5 pl-4 md:border-b-0 md:border-r md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Checked in</p>
              <p className="display tnum mt-2 text-[30px] leading-none">{formatNumber(admitted)}</p>
              <p className="mt-1.5 text-xs text-slate">Scanned at the door</p>
            </div>
            <div className="py-5 pr-4 md:border-r md:pr-6 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Attendance</p>
              <p className="display tnum mt-2 text-[30px] leading-none">{attendanceRate}%</p>
              <p className="mt-1.5 text-xs text-slate">Admitted of tickets sold</p>
            </div>
            <div className="py-5 pl-4 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Gross</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatMoney(sold * (event.basePrice ?? 0))}
              </p>
              <p className="mt-1.5 text-xs text-slate">Before the platform fee</p>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Recent check-ins</h2>
              <span className="text-xs text-slate">{formatNumber(admitted)} admitted</span>
            </div>

            {checkIns.length === 0 ? (
              <p className="mt-4 text-sm text-slate">
                No guests have been scanned in yet. Open the scanner when doors open.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Guest</Th>
                  <Th>Ticket</Th>
                  <Th align="right">Admitted</Th>
                </THead>
                <TBody>
                  {checkIns.slice(0, 20).map((checkIn) => (
                    <tr key={checkIn.id} className="border-b border-line">
                      <Td>
                        <p className="text-sm">{checkIn.ticket?.user?.name ?? 'Ticket holder'}</p>
                        <p className="text-xs text-slate">{checkIn.ticket?.user?.email ?? ''}</p>
                      </Td>
                      <Td>
                        <span className="tnum text-xs text-slate">{checkIn.ticket?.id ?? '—'}</span>
                      </Td>
                      <Td align="right">
                        <span className="tnum text-xs text-slate">{formatDateTime(checkIn.checkedInAt)}</span>
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
