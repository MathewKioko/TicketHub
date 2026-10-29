'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ADMIN_TABS } from '@/lib/site'

interface AdminEvent {
  id: string
  title: string
  description: string | null
  venue: string | null
  date: string | null
  category: string | null
  basePrice: number | null
  status: string
  organizer: { id: string; name: string | null; email: string | null } | null
  _count: { tickets: number }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'all' })
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`/api/admin/events?${params.toString()}`, { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('Admin access required')
      }
      if (!response.ok) throw new Error('Failed to load events')
      const data = await response.json()
      setEvents(data.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [search])

  const moderateEvent = async (eventId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) => {
    setError(null)
    try {
      const response = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action, reason }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to moderate event')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to moderate event')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300)
    return () => clearTimeout(timer)
  }, [load])

  if (loading) {
    return (
      <>
        <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
          <div className="flex flex-col gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-shell rounded-lg" />
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[38px] leading-none sm:text-[44px]">Event oversight</h1>
            <p className="mt-2.5 text-sm text-slate">
              Review, approve, suspend, or reactivate all events across TicketHub.
            </p>
          </div>
          <Input
            label="Search events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, venue, description…"
            className="w-[320px]"
          />
        </div>

        {error && <Notice tone="danger" className="mt-6" title="Error">{error}</Notice>}

        <section className="mt-10 border border-line rounded-lg overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <Th>Event</Th>
                <Th className="w-[160px]">Organizer</Th>
                <Th className="w-[120px]">Venue</Th>
                <Th className="w-[120px]">Date</Th>
                <Th className="w-[100px]">Tickets</Th>
                <Th className="w-[120px]">Status</Th>
                <Th className="w-[220px]">Action</Th>
              </tr>
            </THead>
            <TBody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-line align-top">
                    <Td>
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-0.5 text-xs text-slate">{event.category ?? 'Uncategorized'}</p>
                    </Td>
                    <Td>
                      <p className="text-sm">{event.organizer?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate">{event.organizer?.email ?? '—'}</p>
                    </Td>
                    <Td className="text-xs text-slate">{event.venue ?? '—'}</Td>
                    <Td className="text-xs text-slate">
                      {event.date ? new Date(event.date).toLocaleDateString() : '—'}
                    </Td>
                    <Td className="text-sm font-medium">{event._count.tickets}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'PUBLISHED'
                          ? 'bg-green-soft text-green'
                          : event.status === 'SUSPENDED'
                            ? 'bg-flame-soft text-flame'
                            : event.status === 'CANCELLED'
                              ? 'bg-line text-slate'
                              : 'bg-line-soft text-slate'
                      }`}>
                        {event.status}
                      </span>
                    </Td>
                    <Td align="right" className="flex gap-2">
                      {event.status === 'PUBLISHED' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void moderateEvent(event.id, 'suspend', 'Suspended by admin')}
                            className="text-flame hover:bg-flame-soft"
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void moderateEvent(event.id, 'reject', 'Rejected by admin')}
                            className="text-flame hover:bg-flame-soft"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {event.status === 'SUSPENDED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void moderateEvent(event.id, 'reactivate', 'Reactivated by admin')}
                          className="text-green hover:bg-green-soft"
                        >
                          Reactivate
                        </Button>
                      )}
                      {event.status === 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void moderateEvent(event.id, 'approve', 'Re-approved by admin')}
                          className="text-green hover:bg-green-soft"
                        >
                          Approve
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </section>
      </div>
    </>
  )
}

