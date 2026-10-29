'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTicketCountUpdates } from '@/lib/socket-client'
import { formatEventStamp, formatFullDate, formatMoney, formatNumber, formatTime } from '@/lib/format'
import type { EventDetailData } from '@/lib/events-data'

const MAX_PER_ORDER = 10

export function EventDetail({ event }: { event: EventDetailData }) {
  const router = useRouter()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [sold, setSold] = useState(event.sold)

  const onCountUpdate = useCallback((count: number) => setSold(count), [])
  useTicketCountUpdates(event.id, onCountUpdate)

  const remaining = event.capacity > 0 ? Math.max(event.capacity - sold, 0) : null
  const soldOut = remaining !== null && remaining <= 0
  const isFree = event.basePrice <= 0
  const maxQuantity = Math.max(1, Math.min(remaining ?? MAX_PER_ORDER, MAX_PER_ORDER))
  const lineTotal = event.basePrice * quantity
  const soldPercent =
    event.capacity > 0 ? Math.min(100, Math.round((sold / event.capacity) * 100)) : 0

  const paragraphs = useMemo(
    () => event.description.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
    [event.description]
  )

  function goToCheckout() {
    const params = new URLSearchParams({
      eventId: event.id,
      quantity: String(quantity),
    })
    router.push(`/checkout?${params.toString()}`)
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const startTime = formatTime(event.date)
  const endTime = event.endDate ? formatTime(event.endDate) : null

  return (
    <div className="bg-bone">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-center justify-between border-b border-line py-4">
          <Link href="/events" className="group flex items-center gap-2 text-[13px] text-slate hover:text-ink">
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            All events
          </Link>
          <span className="text-xs text-slate">{event.category}</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-10 lg:grid-cols-[1fr_382px] lg:gap-16 lg:py-12">
          {/* ── event facts ─────────────────────────────────── */}
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] font-medium uppercase tracking-[0.13em]">
              <span className="text-flame">{formatFullDate(event.date)}</span>
              <span aria-hidden className="h-[11px] w-px bg-line" />
              <span className="text-slate">
                {/* formatTime already carries the EAT suffix; strip it from the
                    end time so the range reads "15:00 – 22:00 EAT". */}
                {startTime.replace(' EAT', '')}
                {endTime ? ` – ${endTime.replace(' EAT', '')}` : ''} {startTime ? 'EAT' : ''}
              </span>
            </div>

            <h1 className="display mt-3 max-w-[22ch] text-[42px] leading-[1.04] sm:text-[50px]">
              {event.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate">
              <span className="text-ink">{event.venue}</span>
              <span aria-hidden className="text-line">
                /
              </span>
              <span>{event.organizerName}</span>
              <span aria-hidden className="text-line">
                /
              </span>
              <Link
                href={`/events?location=${encodeURIComponent(event.venue)}`}
                className="underline decoration-line underline-offset-4 hover:decoration-flame"
              >
                More at this venue
              </Link>
            </div>

            <figure className="mt-8 overflow-hidden bg-shell">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center text-[11px] uppercase tracking-[0.14em] text-slate-light">
                  {event.category} · {event.venue}
                </div>
              )}
            </figure>

            <section className="mt-10 border-t border-line pt-8">
              <h2 className="display text-[24px] leading-none">About this event</h2>
              <div className="mt-4 max-w-[62ch] space-y-4 text-[15px] leading-relaxed text-slate">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>The organiser has not added a description for this event yet.</p>
                )}
              </div>
            </section>

            <section className="mt-10 border-t border-line pt-8">
              <h2 className="display text-[24px] leading-none">Good to know</h2>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[168px_1fr] sm:gap-6">
                  <dt className="text-[13px] font-medium">Entry</dt>
                  <dd className="text-sm text-slate">
                    Show the QR code on your ticket at the gate. Each ticket admits one person.
                  </dd>
                </div>
                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[168px_1fr] sm:gap-6">
                  <dt className="text-[13px] font-medium">Ticket delivery</dt>
                  <dd className="text-sm text-slate">
                    Issued to your TicketHub wallet as soon as Paystack confirms the payment.
                  </dd>
                </div>
                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[168px_1fr] sm:gap-6">
                  <dt className="text-[13px] font-medium">Venue</dt>
                  <dd className="text-sm text-slate">{event.venue}</dd>
                </div>
              </dl>
            </section>

            <section className="mt-10 border-t border-line pt-8">
              <h2 className="display text-[24px] leading-none">Organiser</h2>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-6 border border-line px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center bg-ink text-[13px] font-medium tracking-wider text-bone">
                    {event.organizerName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{event.organizerName}</p>
                    <p className="mt-0.5 text-[13px] text-slate">Presents this event on TicketHub</p>
                  </div>
                </div>
                <Link
                  href={`/events?location=${encodeURIComponent(event.venue)}`}
                  className="border border-ink px-4 py-2 text-[13px] font-medium hover:bg-ink hover:text-bone"
                >
                  More events
                </Link>
              </div>
            </section>
          </article>

          {/* ── purchase panel ──────────────────────────────── */}
          <aside className="self-start lg:sticky lg:top-6">
            <div className="border border-ink bg-paper">
              <div className="border-b border-line px-5 py-4">
                <h2 className="display text-[24px] leading-none">Choose tickets</h2>
                <p className="mt-1.5 text-xs text-slate">
                  No booking fees. Prices in Kenyan shillings.
                </p>
              </div>

              {isFree ? (
                <div className="px-5 py-5">
                  <p className="text-sm font-medium">Free entry</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
                    This event is free to attend, so there is nothing to pay and no ticket to buy.
                    Contact the organiser if you need confirmation.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">General admission</p>
                        <p className="mt-0.5 text-[13px] text-slate">{event.category} · single tier</p>
                      </div>
                      <p className="tnum shrink-0 text-right text-[15px] font-medium">
                        {formatMoney(event.basePrice)}
                      </p>
                    </div>

                    {event.capacity > 0 ? (
                      <div className="mt-5">
                        <div className="h-[3px] w-full bg-line">
                          <div className="h-full bg-flame" style={{ width: `${soldPercent}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="tnum text-slate">{formatNumber(sold)} sold</span>
                          <span className="tnum text-slate">
                            {formatNumber(remaining ?? 0)} remaining
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="tnum mt-4 text-xs text-slate">{formatNumber(sold)} sold</p>
                    )}

                    {soldOut ? (
                      <Notice tone="info" className="mt-5" title="Sold out">
                        Every ticket for this event has been issued. Check the programme for other
                        dates.
                      </Notice>
                    ) : (
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-[13px] font-medium">Quantity</span>
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            aria-label="Remove one ticket"
                            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                            disabled={quantity <= 1}
                            className="h-10 w-10 text-[16px] text-slate hover:bg-shell hover:text-ink disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="tnum w-10 text-center text-sm font-medium" aria-live="polite">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Add one ticket"
                            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                            disabled={quantity >= maxQuantity}
                            className="h-10 w-10 text-[16px] text-slate hover:bg-shell hover:text-ink disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {soldOut ? null : (
                    <div className="border-t border-line px-5 py-5">
                      <div className="flex items-center justify-between text-[13px] text-slate">
                        <span className="tnum">
                          {quantity} × General admission
                        </span>
                        <span className="tnum text-ink">{formatNumber(lineTotal)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[13px] text-slate">
                        <span>Booking fees</span>
                        <span className="text-ink">None</span>
                      </div>
                      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                        <span className="text-[13px] font-medium uppercase tracking-[0.1em] text-slate">
                          Total
                        </span>
                        <span className="display tnum text-[30px] leading-none">
                          {formatMoney(lineTotal)}
                        </span>
                      </div>

                      <Button className="mt-5 w-full" onClick={goToCheckout}>
                        Continue to checkout
                      </Button>
                      <p className="mt-3 text-center text-xs text-slate">
                        {user
                          ? 'You can change the quantity on the next step.'
                          : 'You’ll sign in to pay — your selection is kept.'}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2 border-t border-line bg-shell/70 px-5 py-4 text-xs text-slate">
                <p>Secure payment via Paystack — card or M-Pesa.</p>
                <p>Tickets are issued only once payment is confirmed.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button type="button" onClick={share} className="link-quiet">
                Share this event
              </button>
              <span className="text-xs text-slate">{formatEventStamp(event.date)}</span>
            </div>
          </aside>
        </div>
      </div>

      {/*
        Mobile purchase bar. The panel above stacks below the long-form content
        on small screens, so the price and the action stay reachable while the
        reader is still deciding.
      */}
      {isFree || soldOut ? null : (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="tnum text-[15px] font-medium leading-tight">{formatMoney(lineTotal)}</p>
              <p className="tnum mt-0.5 text-[11px] text-slate">
                {quantity} × {formatMoney(event.basePrice)}
                {remaining !== null ? ` · ${formatNumber(remaining)} left` : ''}
              </p>
            </div>
            <Button onClick={goToCheckout} className="shrink-0">
              Get tickets
            </Button>
          </div>
        </div>
      )}
      <div aria-hidden className="h-20 lg:hidden" />
    </div>
  )
}
