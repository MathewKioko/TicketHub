import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { PaymentReturn } from '@/components/tickets/PaymentReturn'
import { Spinner } from '@/components/ui/Feedback'

export const metadata: Metadata = {
  title: 'Payment status',
  description: 'Check whether Paystack has confirmed your payment.',
  robots: { index: false, follow: false },
}

export default function TicketSuccessPage() {
  return (
    <>
      <FocusedHeader rightLabel="My tickets" rightHref="/dashboard/attendee" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[620px] px-5 py-14">
            <Spinner label="Checking payment status" />
          </div>
        }
      >
        <PaymentReturn />
      </Suspense>
    </>
  )
}
