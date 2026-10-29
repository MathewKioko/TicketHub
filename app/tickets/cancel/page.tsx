import type { Metadata } from 'next'
import Link from 'next/link'
import { Notice } from '@/components/ui/Notice'
import { FocusedHeader } from '@/components/layout/FocusedHeader'

export const metadata: Metadata = {
  title: 'Payment cancelled',
  robots: { index: false, follow: false },
}

export default function TicketCancelPage() {
  return (
    <>
      <FocusedHeader rightLabel="All events" rightHref="/events" />
      <div className="mx-auto max-w-[620px] px-5 py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">Payment cancelled</p>
        <h1 className="display mt-3 text-[40px] leading-[1.04]">Nothing was issued</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          You left Paystack before the payment finished, so no ticket was issued for this order. If
          money did leave your account, check your wallet before trying again.
        </p>

        <Notice tone="info" className="mt-6" title="Start again when you're ready">
          Your event is still on sale. Reopen it to choose tickets, or check whether an earlier
          attempt already went through.
        </Notice>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/events" className="bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft">
            Browse events
          </Link>
          <Link
            href="/dashboard/attendee"
            className="border border-ink px-5 py-3 text-[13px] font-medium hover:bg-ink hover:text-bone"
          >
            Check my tickets
          </Link>
        </div>
      </div>
    </>
  )
}
