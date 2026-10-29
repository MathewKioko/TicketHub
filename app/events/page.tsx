import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventsBrowser } from '@/components/events/EventsBrowser'

export const metadata: Metadata = {
  title: 'Browse events',
  description:
    'Browse concerts, theatre, comedy and conferences on sale across Kenya. Filter by date, category, venue and price.',
  alternates: { canonical: '/events' },
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
          <div className="border-b border-ink pb-5">
            <h1 className="display text-[38px] leading-none sm:text-[42px]">Events in Nairobi</h1>
            <p className="mt-2 text-[13px] text-slate">Searching…</p>
          </div>
        </div>
      }
    >
      <EventsBrowser />
    </Suspense>
  )
}
