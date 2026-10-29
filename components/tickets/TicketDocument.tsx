'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Skeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { downloadCalendarFile } from '@/lib/calendar'
import { downloadTicketReceipt } from '@/lib/ticket-receipt'
import { asDate, formatDateTime, formatFullDate, formatMoney, formatTime } from '@/lib/format'
import { ticketStatus } from '@/lib/status'

interface TicketPayload {
  id: string
  status: string
  price: number
  quantity: number
  qrCodeImage?: string | null
  qrCodeData?: string | null
  checkedInAt?: string | null
  event: {
    id: string
    title: string
    description?: string
    date: string
    venue: string
    imageUrl?: string | null
  }
  user: {
    name: string
    email: string
  }
}

export function TicketDocument({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<TicketPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, { cache: 'no-store' })
        if (response.status === 404) throw new Error('No ticket exists with that reference.')
        if (response.status === 403) throw new Error('You do not have access to this ticket.')
        if (!response.ok) throw new Error('The ticket could not be loaded.')
        const data = (await response.json()) as { ticket?: TicketPayload }
        if (!data.ticket) throw new Error('The ticket could not be loaded.')
        if (!cancelled) setTicket(data.ticket)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'The ticket could not be loaded.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ticketId])

  async function downloadReceipt(current: TicketPayload) {
    if (busy) return
    setBusy(true)
    try {
      await downloadTicketReceipt({
        id: current.id,
        event: {
          title: current.event.title,
          date: current.event.date,
          venue: current.event.venue,
          imageUrl: current.event.imageUrl ?? undefined,
        },
        user: current.user,
        price: current.price,
        quantity: current.quantity,
        status: current.status,
        qrCodeImage: current.qrCodeImage ?? undefined,
        qrCodeData: current.qrCodeData ?? undefined,
      })
    } catch {
      toast.error('The receipt could not be generated')
    } finally {
      setBusy(false)
    }
  }

  function addToCalendar(current: TicketPayload) {
    const start = asDate(current.event.date)
    if (!start) {
      toast.error('This event has no usable date')
      return
    }
    downloadCalendarFile(
      {
        title: current.event.title,
        description: current.event.description ?? `Tickets for ${current.event.title}`,
        location: current.event.venue,
        startDate: start,
        organizer: { name: 'TicketHub', email: 'tickets@tickethub.co.ke' },
      },
      `ticket-${current.id}.ics`
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-10">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-14">
        <h1 className="display text-[34px] leading-tight">Ticket unavailable</h1>
        <Notice tone="danger" className="mt-5">
          {error ?? 'This ticket could not be loaded.'}
        </Notice>
        <Link
          href="/dashboard/attendee"
          className="mt-6 inline-block border border-ink px-5 py-2.5 text-[13px] font-medium hover:bg-ink hover:text-bone"
        >
          Open my tickets
        </Link>
      </div>
    )
  }

  const valid = ticket.status === 'CONFIRMED' || ticket.status === 'CHECKED_IN'
  const startTime = formatTime(ticket.event.date)

  return (
    <div className="mx-auto max-w-[560px] px-5 py-10 sm:py-12">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Admission ticket</p>
        <p className="tnum text-[11px] text-slate">{ticket.id}</p>
      </div>

      <article className="mt-3 border border-ink bg-paper">
        <div className="flex items-center justify-between bg-ink px-5 py-3 text-bone">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Admit one</span>
          <span className="tnum text-[11px] uppercase tracking-[0.12em] text-[#C9C2B6]">
            {formatFullDate(ticket.event.date)}
            {startTime ? ` · ${startTime}` : ''}
          </span>
        </div>

        <div className="px-5 pb-5 pt-6">
          <h1 className="display text-[30px] leading-[1.08]">{ticket.event.title}</h1>
          <p className="mt-2 text-[13px] text-slate">{ticket.event.venue}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-line pt-5">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate">Attendee</dt>
              <dd className="mt-1 text-sm">{ticket.user?.name || 'Ticket holder'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate">Ticket type</dt>
              <dd className="mt-1 text-sm">General admission</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate">Paid</dt>
              <dd className="tnum mt-1 text-sm">{formatMoney(ticket.price)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={ticketStatus(ticket.status)} />
              </dd>
            </div>
          </dl>

          {!isConfirmed(ticket.status) ? (
            <Notice tone="warning" className="mt-5" title="Not valid for entry yet">
              {ticket.status === 'PENDING'
                ? 'Paystack has not confirmed this payment yet. The QR code appears once it does.'
                : 'This ticket is no longer valid for entry.'}
            </Notice>
          ) : null}

          {ticket.status === 'CHECKED_IN' && ticket.checkedInAt ? (
            <Notice tone="info" className="mt-5" title="Already scanned">
              Admitted {formatDateTime(ticket.checkedInAt)}.
            </Notice>
          ) : null}
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -left-[11px] -top-[10px] h-5 w-5 rounded-full bg-bone" />
          <div aria-hidden className="absolute -right-[11px] -top-[10px] h-5 w-5 rounded-full bg-bone" />
          <div className="mx-4 border-t border-dashed border-line" />
        </div>

        <div className="flex items-start gap-6 px-5 py-6">
          {valid && ticket.qrCodeImage ? (
            <div className="shrink-0 border border-line bg-white p-2.5">
              {/* QR is a base64 data URL generated server-side; not an optimisable asset. */}
              <img
                src={ticket.qrCodeImage}
                alt="Entry QR code for this ticket"
                width={152}
                height={152}
                className="h-[152px] w-[152px]"
              />
            </div>
          ) : valid ? (
            // Confirmed ticket whose QR image was not generated: show the code
            // itself rather than implying the ticket is unpaid.
            <div className="flex h-[176px] w-[176px] shrink-0 flex-col justify-center gap-2 border border-dashed border-line bg-shell px-3 text-center">
              <span className="text-[10px] uppercase tracking-[0.14em] text-slate">Ticket code</span>
              <span className="break-all text-[11px] leading-snug text-ink">{ticket.qrCodeData ?? ticket.id}</span>
              <span className="text-[11px] leading-snug text-slate">Staff can enter this at the door</span>
            </div>
          ) : (
            <div className="flex h-[176px] w-[176px] flex-col justify-center gap-2 border border-dashed border-line bg-shell px-3 text-center text-[11px] leading-snug text-slate">
              <span className="text-[11px] uppercase tracking-[0.12em]">Code pending</span>
              <span>Tickets are issued once payment is confirmed.</span>
            </div>
          )}

          <div className="min-w-0 pt-1">
            <p className="text-[13px] font-medium">
              {valid ? 'Scan at the gate' : 'Entry code'}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate">
              {valid
                ? 'Present this screen or a printed copy. The code is scanned once, then the ticket is marked as admitted.'
                : 'Tickets are issued only once Paystack confirms the payment.'}
            </p>
            <p className="tnum mt-4 text-[11px] uppercase tracking-[0.13em] text-slate">Ticket ID</p>
            <p className="tnum text-[13px]">{ticket.id}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line bg-[#F5F0E7] px-5 py-3">
          <span className="text-[11px] text-slate">One admission · scanned once at the gate</span>
          <span className="text-[11px] text-slate">TicketHub</span>
        </div>
      </article>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <Button variant="secondary" size="md" onClick={() => void downloadReceipt(ticket)} disabled={busy}>
          {busy ? 'Preparing…' : 'Download receipt'}
        </Button>
        <div className="flex items-center gap-6 text-[13px] text-slate">
          <button type="button" onClick={() => addToCalendar(ticket)} className="link-quiet">
            Add to calendar
          </button>
          <Link href={`/events/${ticket.event.id}`} className="link-quiet">
            View event
          </Link>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-5">
        <p className="text-xs leading-relaxed text-slate">
          This ticket admits one person and is valid only for the event and date shown. If the code
          will not scan, venue staff can look the ticket up by its ID.
        </p>
      </div>
    </div>
  )
}

function isConfirmed(status: string): boolean {
  return status === 'CONFIRMED' || status === 'CHECKED_IN'
}
