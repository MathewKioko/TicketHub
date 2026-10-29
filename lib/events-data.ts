import { prisma } from '@/lib/db'
import type { EventSummary } from '@/lib/types'

export type { EventSummary }

export interface EventDetailData extends EventSummary {
  description: string
  endDate: string | null
}

/** Single event for the public event page and its metadata. */
export async function getEventDetail(id: string): Promise<EventDetailData | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, name: true } } },
    })
    if (!event) return null

    let sold = 0
    try {
      sold = await prisma.ticket.count({
        where: { eventId: id, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      })
    } catch (countError) {
      console.error('Failed to count tickets for event', countError)
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString(),
      endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
      venue: event.venue,
      category: event.category,
      imageUrl: event.imageUrl ?? null,
      basePrice: event.basePrice ?? 0,
      currency: event.currency ?? 'KES',
      status: event.status,
      organizerId: event.organizerId,
      organizerName: event.organizer?.name ?? 'TicketHub organizer',
      sold,
      capacity: event.totalTickets ?? 0,
    }
  } catch (error) {
    console.error('Failed to load event detail', error)
    return null
  }
}

/**
 * Server-side event listing for public pages. Falls back to an empty list
 * rather than throwing when the database is unreachable.
 */
export async function getPublishedEvents(limit = 60): Promise<EventSummary[]> {
  try {
    const events = await prisma.event.findMany({
      where: { status: { not: 'DRAFT' } },
      orderBy: { date: 'asc' },
      take: limit,
      include: { organizer: { select: { name: true } } },
    })

    if (events.length === 0) return []

    const ids = events.map((event) => event.id)
    let soldByEvent: Record<string, number> = {}

    try {
      const grouped = await prisma.ticket.groupBy({
        by: ['eventId'],
        where: { eventId: { in: ids }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        _count: { _all: true },
      })
      soldByEvent = Object.fromEntries(grouped.map((row) => [row.eventId, row._count._all]))
    } catch (countError) {
      console.error('Failed to count tickets for events', countError)
    }

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString(),
      venue: event.venue,
      category: event.category,
      imageUrl: event.imageUrl ?? null,
      basePrice: event.basePrice ?? 0,
      currency: event.currency ?? 'KES',
      status: event.status,
      organizerId: event.organizerId,
      organizerName: event.organizer?.name ?? 'TicketHub organizer',
      sold: soldByEvent[event.id] ?? 0,
      capacity: event.totalTickets ?? 0,
    }))
  } catch (error) {
    console.error('Failed to load published events', error)
    return []
  }
}
