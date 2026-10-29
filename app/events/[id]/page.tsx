import type { Metadata } from 'next'
import Link from 'next/link'
import { EventDetail } from '@/components/events/EventDetail'
import { getEventDetail } from '@/lib/events-data'
import { formatFullDate } from '@/lib/format'

export const revalidate = 60

interface EventPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await getEventDetail(params.id)
  if (!event) return { title: 'Event not found' }
  return {
    title: event.title,
    description: event.description?.slice(0, 155) ?? `${event.title} at ${event.venue}.`,
    openGraph: {
      title: event.title,
      description: `${formatFullDate(event.date)} · ${event.venue}`,
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEventDetail(params.id)

  if (!event) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-20 text-center sm:px-8">
        <p className="display text-[34px] leading-tight">This event isn&rsquo;t available</p>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-slate">
          It may have been removed by the organiser, or the link is incomplete.
        </p>
        <Link
          href="/events"
          className="mt-6 inline-block bg-ink px-5 py-3 text-[13px] font-medium text-bone hover:bg-ink-soft"
        >
          Browse events
        </Link>
      </div>
    )
  }

  return <EventDetail event={event} />
}
