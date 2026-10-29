import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutReview } from '@/components/checkout/CheckoutReview'
import { FocusedHeader } from '@/components/layout/FocusedHeader'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Review your tickets and pay securely with Paystack.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <>
      <FocusedHeader rightLabel="All events" rightHref="/events" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
            <h1 className="display text-[40px] leading-[1.02]">Review your tickets</h1>
            <p className="mt-3 text-sm text-slate">Loading your order…</p>
          </div>
        }
      >
        <CheckoutReview />
      </Suspense>
    </>
  )
}
