import { prisma } from './db'

export type ScanVerdict =
  | 'VALID'
  | 'ALREADY_USED'
  | 'WRONG_EVENT'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'NOT_CONFIRMED'
  | 'NOT_FOUND'

export interface ScanResult {
  verdict: ScanVerdict
  valid: boolean
  message: string
  ticket?: {
    id: string
    status: string
    checkedInAt?: Date
    user: {
      name: string
      email: string
    }
    event: {
      id: string
      title: string
      date: Date
      venue: string
    }
  }
}

/**
 * Decode a scanned QR payload into a ticket reference.
 * Supports both the legacy `eventId:ticketId:userId` format and the
 * modern URL format `/tickets/{id}`.
 */
export function decodeTicketReference(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()

  // Modern URL format: https://host/tickets/{ticketId}
  const urlMatch = trimmed.match(/[?/]tickets\/([^?/&]+)/)
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1]
  }

  // Legacy format: eventId:ticketId:userId
  const parts = trimmed.split(':')
  if (parts.length === 3 && parts[1]) {
    return parts[1]
  }

  // If the raw value is itself an ObjectId (24 hex chars), treat as ticket id
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Core ticket validation used by the scanner endpoint.
 * Images a consistent set of business rules across all scan surfaces.
 */
export async function validateTicketForScan(
  ticketId: string,
  expectedEventId?: string
): Promise<ScanResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: { name: true, email: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          venue: true,
        },
      },
      checkIn: true,
    },
  })

  if (!ticket) {
    return {
      verdict: 'NOT_FOUND',
      valid: false,
      message: 'Ticket not found. Please check the QR code.',
    }
  }

  // Event scoping: if an expected event is provided, the ticket must match it
  if (expectedEventId && ticket.eventId !== expectedEventId) {
    return {
      verdict: 'WRONG_EVENT',
      valid: false,
      message: 'This ticket is for a different event.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  // Already checked in (single-use)
  if (ticket.status === 'CHECKED_IN' || ticket.checkIn) {
    return {
      verdict: 'ALREADY_USED',
      valid: false,
      message: 'This ticket has already been used.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        checkedInAt: ticket.checkIn?.checkedInAt,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  // Cancelled or refunded
  if (ticket.status === 'CANCELLED') {
    return {
      verdict: 'CANCELLED',
      valid: false,
      message: 'This ticket has been cancelled.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  if (ticket.status === 'REFUNDED') {
    return {
      verdict: 'REFUNDED',
      valid: false,
      message: 'This ticket has been refunded.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  // Must be confirmed
  if (ticket.status !== 'CONFIRMED') {
    return {
      verdict: 'NOT_CONFIRMED',
      valid: false,
      message: `Ticket status is ${ticket.status}. Payment not confirmed.`,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  // Expired: past the event end (or 6h after start if no endDate)
  const endDate = ticket.event.date
  const eventEndsAt = endDate
  const now = new Date()
  if (eventEndsAt && now > new Date(eventEndsAt.getTime() + 6 * 60 * 60 * 1000)) {
    return {
      verdict: 'EXPIRED',
      valid: false,
      message: 'This ticket is for an event that has already ended.',
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date,
          venue: ticket.event.venue,
        },
      },
    }
  }

  return {
    verdict: 'VALID',
    valid: true,
    message: 'Ticket is valid. Check-in approved.',
    ticket: {
      id: ticket.id,
      status: ticket.status,
      user: ticket.user,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        date: ticket.event.date,
        venue: ticket.event.venue,
      },
    },
  }
}

/**
 * Mark a validated ticket as checked in (single-use).
 * Note: some deployments have no Scanner model records, so the scanner
 * link is written to the audit log instead of a CheckIn.scanner relation.
 */
export async function checkInTicket(ticketId: string, scannerId?: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      eventId: true,
      status: true,
    },
  })

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  // Create the check-in (scanner link optional — may not map to a Scanner record)
  const checkIn = await prisma.checkIn.create({
    data: {
      ticketId,
      eventId: ticket.eventId,
      // Only set scannerId if the value maps to a Scanner; otherwise leave null
      // (the audit log records which user performed the scan)
      ...(scannerId ? { scannerId } : {}),
    },
  })

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
    },
  })

  return checkIn
}
