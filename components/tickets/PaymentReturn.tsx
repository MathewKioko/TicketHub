'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Spinner } from '@/components/ui/Feedback'
import { TicketDocument } from '@/components/tickets/TicketDocument'
import { ticketStatus } from '@/lib/status'

type PaymentState = 'loading' | 'pending' | 'confirmed' | 'failed' | 'notFound'

export function PaymentReturn({ paymentMethod }: { paymentMethod?: 'paystack' | 'mpesa' }) {
  const params = useSearchParams()
  const [state, setState] = useState<PaymentState>('loading')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Checking your payment status')
  const [attempt, setAttempt] = useState(0)
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false)

  const isMpesa = paymentMethod === 'mpesa'
  const param = isMpesa ? params.get('checkoutRequestId') : params.get('reference')

  useEffect(() => {
    if (!param) {
      setState('notFound')
      setMessage('No payment reference was provided.')
      return
    }

    const reference = param
    let cancelled = false
    let currentAttempt = 0

    async function poll() {
      for (let attemptIndex = 0; attemptIndex < 30; attemptIndex++) {
        if (cancelled) return
        currentAttempt = attemptIndex + 1
        setAttempt(currentAttempt)
        setMaxAttemptsReached(false)

        try {
          if (isMpesa) {
            const statusResponse = await fetch('/api/mpesa/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkoutRequestId: reference }),
            })
            const data = await statusResponse.json()

            if (data.status === 'success') {
              const ticket = await findTicketByCheckoutId(reference)
              if (!cancelled) {
                if (ticket) {
                  setTicketId(ticket)
                  setState('confirmed')
                  setMessage('Payment confirmed. Your ticket is ready.')
                } else {
                  setState('pending')
                  setMessage('Payment received. We are issuing your ticket.')
                }
              }
              return
            }
            if (!cancelled) {
              setMessage(
                data.resultDesc
                  ? `M-Pesa: ${data.resultDesc}`
                  : 'Payment not yet confirmed. We keep checking.'
              )
            }
          } else {
            const response = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`)
            const data = await response.json()
            if (data.verified) {
              const ticket = await findTicketByReference(reference)
              if (!cancelled) {
                if (ticket) {
                  setTicketId(ticket)
                  setState('confirmed')
                  setMessage('Payment confirmed. Your ticket is ready.')
                } else {
                  setState('pending')
                  setMessage('Payment confirmed. We are issuing your ticket.')
                }
              }
              return
            }
            if (!cancelled) {
              setMessage(data.message ?? 'Payment not yet confirmed. We keep checking.')
            }
          }
        } catch {
          if (!cancelled) {
            setMessage('Could not reach the payment service. Retrying…')
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      if (!cancelled) {
        setMaxAttemptsReached(true)
        setState('failed')
        setMessage(
          'We could not confirm your payment after multiple attempts. Please contact support with your reference.'
        )
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [param, isMpesa])

  async function findTicketByCheckoutId(reference: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/tickets/session/${encodeURIComponent(reference)}`)
      const data = await response.json()
      const tickets = data.tickets ?? []
      const confirmed = tickets.find(
        (t: { id: string; status: string }) =>
          t.status === 'CONFIRMED' || t.status === 'CHECKED_IN'
      )
      return confirmed ? confirmed.id : null
    } catch {
      return null
    }
  }

  async function findTicketByReference(reference: string): Promise<string | null> {
    return findTicketByCheckoutId(reference)
  }

  async function retry() {
    setAttempt(0)
    setMaxAttemptsReached(false)
    setState('loading')
    setMessage('Checking your payment status again…')
    // Re-trigger the effect by forcing a re-mount via state
    window.location.reload()
  }

  if (state === 'loading' || (state === 'pending' && !ticketId)) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-14">
        <div className="flex flex-col items-center gap-4">
          <Spinner label={message} />
          {attempt > 0 && (
            <p className="text-xs text-slate">
              Attempt {attempt} of 30 · Checking every 3 seconds
            </p>
          )}
        </div>
      </div>
    )
  }

  if (state === 'confirmed' && ticketId) {
    return <TicketDocument ticketId={ticketId} />
  }

  if (state === 'notFound') {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-14">
        <h1 className="display text-[34px] leading-tight">No payment to check</h1>
        <Notice tone="danger" className="mt-5" title="Missing reference">
          {message}
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
    <div className="mx-auto max-w-[620px] px-5 py-14">
      <h1 className="display text-[34px] leading-tight">
        {maxAttemptsReached ? 'Payment check timed out' : 'Payment not confirmed'}
      </h1>
      <Notice tone="warning" className="mt-5" title={ticketStatus('PENDING').label}>
        {message}
      </Notice>
      <p className="mt-4 text-sm text-slate">
        Your tickets are still reserved. If you completed the payment, this page updates automatically.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Check again
        </Button>
        <Link href="/dashboard/attendee" className="inline-block">
          <Button variant="ghost">Open my tickets</Button>
        </Link>
      </div>
    </div>
  )
}
