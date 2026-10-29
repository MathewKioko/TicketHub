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
  const [message, setMessage] = useState('Checking your payment status')

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

    async function poll() {
      for (let attempt = 0; attempt < 30; attempt++) {
        if (cancelled) return
        try {
          if (isMpesa) {
            // Ask M-Pesa directly whether the STK Push completed.
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
                } else {
                  setState('pending')
                  setMessage('Payment received. We are issuing your ticket.')
                }
              }
              return
            }
            setMessage(
              data.resultDesc
                ? `M-Pesa: ${data.resultDesc}`
                : 'Payment not yet confirmed. We keep checking.'
            )
          } else {
            // Verify the Paystack transaction and mark tickets CONFIRMED server-side.
            const response = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`)
            const data = await response.json()
            if (data.verified) {
              const ticket = await findTicketByReference(reference)
              if (!cancelled) {
                if (ticket) {
                  setTicketId(ticket)
                  setState('confirmed')
                } else {
                  setState('pending')
                  setMessage('Payment confirmed. We are issuing your ticket.')
                }
              }
              return
            }
            setMessage(data.message ?? 'Payment not yet confirmed. We keep checking.')
          }
        } catch {
          if (!cancelled) setMessage('Could not reach the payment service. Retrying…')
        }
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      if (!cancelled) {
        setState('failed')
        setMessage('We could not confirm your payment. Please contact support with your reference.')
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [param, isMpesa])

  async function findTicketByCheckoutId(reference: string): Promise<string | null> {
    try {
      // The session endpoint accepts both Paystack references and Stripe session IDs.
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

  if (state === 'loading' || (state === 'pending' && !ticketId)) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-14">
        <Spinner label={message} />
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
      <h1 className="display text-[34px] leading-tight">Payment not confirmed</h1>
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