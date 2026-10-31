'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Skeleton } from '@/components/ui/Feedback'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatEventStamp, formatMoney, formatNumber } from '@/lib/format'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import type { EventSummary } from '@/lib/types'

interface RawEvent {
  id: string
  title: string
  date: string
  venue: string
  category: string
  imageUrl?: string | null
  basePrice?: number
  currency?: string
  status?: string
  organizerId?: string
  organizer?: { name?: string }
  totalTickets?: number
  _count?: { tickets?: number }
}

function toSummary(raw: RawEvent): EventSummary {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    venue: raw.venue,
    category: raw.category,
    imageUrl: raw.imageUrl ?? null,
    basePrice: raw.basePrice ?? 0,
    currency: raw.currency ?? 'KES',
    status: raw.status ?? 'PUBLISHED',
    organizerId: raw.organizerId,
    organizerName: raw.organizer?.name ?? 'Organizer',
    sold: raw._count?.tickets ?? 0,
    capacity: raw.totalTickets ?? 0,
  }
}

export function CheckoutReview() {
  const params = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const eventId = params.get('eventId') ?? ''
  const quantity = Math.max(1, Number.parseInt(params.get('quantity') ?? '1', 10) || 1)

  const [event, setEvent] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [method, setMethod] = useState<'paystack' | 'mpesa' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const returnPath = useMemo(() => {
    const nextParams = new URLSearchParams({ eventId, quantity: String(quantity) })
    return `/checkout?${nextParams.toString()}`
  }, [eventId, quantity])

  // Signed-out buyers are sent to sign in, then returned to this exact order.
  useEffect(() => {
    if (authLoading || user || !eventId) return
    router.replace(`/auth/login?next=${encodeURIComponent(returnPath)}`)
  }, [authLoading, user, router, returnPath, eventId])

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      setLoadError('This checkout link is missing an event.')
      return
    }

    let cancelled = false
    async function loadEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('This event is no longer available.')
        const data = (await response.json()) as { event?: RawEvent }
        if (!data.event) throw new Error('This event is no longer available.')
        if (!cancelled) setEvent(toSummary(data.event))
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load this event.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadEvent()
    return () => {
      cancelled = true
    }
  }, [eventId])

  async function onPay(_method?: 'paystack' | 'mpesa', _phoneNumber?: string) {
    if (submittingRef.current || !event) return
    submittingRef.current = true
    setSubmitting(true)
    setPayError(null)

    try {
      const createResponse = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, quantity }),
      })
      const created = (await createResponse.json()) as { error?: string; tickets?: { id: string }[] }
      if (!createResponse.ok) throw new Error(created.error ?? 'Could not reserve those tickets.')

      const ticketIds = (created.tickets ?? []).map((ticket) => ticket.id)
      if (ticketIds.length === 0) throw new Error('No tickets were reserved. Please try again.')

      const endpoint = _method === 'mpesa'
        ? '/api/mpesa/checkout'
        : '/api/paystack/checkout'

      const payResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_method === 'mpesa' ? { ticketIds, phoneNumber: _phoneNumber } : { ticketIds }),
      })
      const payment = (await payResponse.json()) as { error?: string; authorizationUrl?: string }
      if (!payResponse.ok || !payment.authorizationUrl) {
        throw new Error(payment.error ?? 'Could not start the payment.')
      }

      // Keep the control locked while the browser leaves for the provider.
      window.location.href = payment.authorizationUrl
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Payment could not be started.')
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (!eventId) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-16 sm:px-8">
        <h1 className="display text-[34px] leading-tight">Checkout</h1>
        <Notice tone="danger" className="mt-6" title="Nothing to check out">
          This page needs an event and a ticket quantity. Start again from the event page.
        </Notice>
        <Link
          href="/events"
          className="mt-6 inline-block border border-ink px-5 py-2.5 text-[13px] font-medium hover:bg-ink hover:text-bone"
        >
          Browse events
        </Link>
      </div>
    )
  }

    return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 lg:py-14">
      <div className="max-w-[52ch]">
        <h1 className="display text-[34px] leading-[1.02] sm:text-[46px]">Review your tickets</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Check the details below. Nothing is charged until you continue to Paystack.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : loadError || !event ? (
        <div className="mt-8">
          <Notice tone="danger" title="We couldn’t load this order">
            {loadError ?? 'This event is not available.'}
            <div className="mt-3">
              <Link href="/events" className="underline decoration-line underline-offset-4">
                Back to events
              </Link>
            </div>
          </Notice>
        </div>
      ) : (
        <div className="mt-8 gap-8 lg:grid-cols-[1fr_392px] lg:gap-16 grid-cols-1">
          <div className="min-w-0">
            <section>
              <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Your order</h2>
                <Link href={`/events/${event.id}`} className="link-quiet text-[13px]">
                  Change tickets
                </Link>
              </div>

              <div className="flex gap-5 py-5">
                <div className="h-[88px] w-[104px] shrink-0 overflow-hidden bg-shadow rounded-[8px]">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    {formatEventStamp(event.date)}
                  </p>
                  <h3 className="mt-1.5 text-[20px] leading-tight">{event.title}</h3>
                  <p className="mt-1 text-[12px] text-slate">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line py-4">
                <div>
                  <p className="text-sm font-medium">General admission</p>
                  <p className="mt-0.5 text-[13px] text-slate">
                    {formatNumber(quantity)} {quantity === 1 ? 'ticket' : 'tickets'} ·{' '}
                    {formatMoney(event.basePrice)} each
                  </p>
                </div>
                <p className="tnum text-[15px] font-medium">
                  {formatMoney(event.basePrice * quantity)}
                </p>
              </div>
            </section>

            <section className="mt-10">
              <div className="border-b border-line pb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Paying as</h2>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">{user?.name ?? '—'}</p>
                  <p className="mt-0.5 text-[13px] text-slate">{user?.email ?? '—'}</p>
                </div>
                {user?.verified ? (
                  <p className="text-xs font-medium text-forest">Email verified</p>
                ) : (
                  <p className="text-xs font-medium text-crimson">Email not verified</p>
                )}
              </div>
              <p className="text-xs text-slate">
                Not you?{' '}
                <Link href={`/auth/login?next=${encodeURIComponent(returnPath)}`} className="link-quiet">
                  Sign in with a different account
                </Link>
              </p>
            </section>

            <section className="mt-10">
              <div className="border-b border-line pb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Payment</h2>
              </div>
              <div className="mt-4 border border-line bg-[#FBF7F0] p-4 text-[13px] leading-relaxed text-slate">
    {method === 'mpesa' ? (
      <>
        <span className="font-medium text-ink">You'll pay via M-Pesa.</span>
        <p className="mt-1 text-xs text-slate">
          Enter your phone number to receive an STK Push on your phone. Approve the payment to confirm your tickets. Nothing is charged before you continue.
        </p>
      </>
    ) : (
      <>
        <span className="font-medium text-ink">You'll pay on Paystack.</span>
        <p className="mt-1 text-xs text-slate">
          Choose card or M-Pesa there. Paystack confirms the payment, then we issue your tickets. Nothing is charged before you continue.
        </p>
      </>
    )}
</div>

            </section>

            {!user?.verified ? (
              <Notice tone="warning" className="mt-8" title="Verify your email to pay">
                Ticket sales need a verified email so your tickets reach you.{' '}
                <Link href="/auth/verify" className="underline decoration-line underline-offset-2">
                  Enter your verification code
                </Link>
                .
              </Notice>
            ) : null}

            {payError ? (
              <Notice tone="danger" className="mt-8" title="Payment could not start">
                {payError}
              </Notice>
            ) : null}

            <div className="mt-8 border-t border-line pt-5">
              <p className="max-w-[58ch] text-xs leading-relaxed text-slate">
                TicketHub adds no booking fee. Your card or M-Pesa details are entered on Paystack’s
                secure page and are never stored by us.
              </p>
            </div>
          </div>

          <aside className="self-start lg:sticky lg:top-8 mt-6 lg:mt-0">
            <div className="border border-ink border-t-2 border-t-flame bg-paper rounded-sm overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="display text-[22px] leading-none">Order summary</h2>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-start justify-between gap-4 text-[13px]">
                  <span className="text-slate">{formatNumber(quantity)} × General admission</span>
                  <span className="tnum">{formatNumber(event.basePrice * quantity)}</span>
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-4 text-[13px]">
                  <span className="text-slate">Booking fees</span>
                  <span>None</span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
                    Total
                  </span>
                  <span className="display tnum text-[30px] leading-none">
                    {formatMoney(event.basePrice * quantity)}
                  </span>
                </div>

                <PaymentMethodSelector
                  totalAmount={event.basePrice * quantity}
                  selectedMethod={method}
                  submitting={submitting}
                  onSelect={async (chosenMethod, phoneNumber) => {
                    setMethod(chosenMethod)
                    await onPay(chosenMethod, phoneNumber)
                  }}
                />

                <p className="mt-3 text-center text-xs leading-relaxed text-slate">
                  {method === 'mpesa'
                    ? 'Enter your M-Pesa phone number, then approve the payment on your phone.'
                    : 'Choose card or M-Pesa on Paystack. Tickets are issued only after payment is confirmed.'}
                </p>

                <div className="border-t border-line bg-[#F5F0E7] px-5 py-4">
                <ul className="space-y-2 text-xs text-slate">
                  <li>Secured by Paystack and M-Pesa — PCI-DSS compliant</li>
                  <li>QR ticket issued to your wallet after payment</li>
                  <li>Entry handled by the organiser</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
