import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, logAuditAction } from '@/lib/auth'
import { decodeTicketReference, validateTicketForScan, checkInTicket } from '@/lib/scan'
import { headers } from 'next/headers'

// Roles allowed to operate the scanner at event gates
const SCANNER_ROLES = ['ORGANIZER', 'EVENT_OWNER', 'SCANNER', 'ADMIN']

/**
 * POST /api/tickets/scan
 * Body: { qrCodeData: string, eventId?: string }
 *
 * Validates a scanned ticket against event-scoped business rules and,
 * if valid, performs a single-use check-in.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SCANNER_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Scanner access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { qrCodeData, eventId } = body

    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return NextResponse.json(
        { error: 'QR code data required' },
        { status: 400 }
      )
    }

    // Decode the QR payload into a ticket id
    const ticketId = decodeTicketReference(qrCodeData)
    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          verdict: 'INVALID_FORMAT',
          valid: false,
          message: 'Could not read a ticket code from this QR. Please try again.',
        },
        { status: 400 }
      )
    }

    // Resolve the event being scanned at (if provided)
    let scannedEventId: string | undefined
    if (eventId) {
      scannedEventId = eventId
    } else {
      // Fall back to the ticket's own event if no eventId provided (legacy/all-events mode)
      const scannedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { eventId: true },
      })
      scannedEventId = scannedTicket?.eventId
    }

    // Owner/scanning permissions: ensure this scanner is authorized for the event
    if (scannedEventId && !isEventAccessibleByRole(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Scanner access required' },
        { status: 403 }
      )
    }

    // If the scanner is an EVENT_OWNER or ORGANIZER, restrict to their events
    const isOwnerScoped = user.role === 'EVENT_OWNER' || user.role === 'ORGANIZER'
    if (isOwnerScoped && scannedEventId) {
      const event = await prisma.event.findUnique({
        where: { id: scannedEventId },
        select: { organizerId: true },
      })
      if (event && event.organizerId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            verdict: 'FORBIDDEN_EVENT',
            valid: false,
            message: 'You do not have permission to scan tickets for this event.',
          },
          { status: 403 }
        )
      }
    }

// Run the core validation
    const result = await validateTicketForScan(ticketId, scannedEventId)

    // If valid, perform the single-use check-in
    // (scannerId intentionally omitted — user id doesn't map to a Scanner record;
    //  the audit log below records which user performed the scan)
    if (result.valid && result.ticket) {
      await checkInTicket(ticketId)

      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const userAgent = headersList.get('user-agent') || 'unknown'
      await logAuditAction(
        'TICKET_SCAN',
        'TICKET',
        user.id,
        `Ticket ${result.ticket.id} checked in by ${user.name} (${user.id}) for event ${result.ticket.event.title}`,
        ipAddress,
        userAgent
      )

      return NextResponse.json({
        success: true,
        verdict: 'VALID',
        valid: true,
        message: 'Check-in successful',
        ticket: {
          id: result.ticket.id,
          status: 'CHECKED_IN',
          checkedInAt: new Date().toISOString(),
          user: result.ticket.user,
          event: {
            id: result.ticket.event.id,
            title: result.ticket.event.title,
            date: result.ticket.event.date.toISOString(),
            venue: result.ticket.event.venue,
          },
        },
      })
    }

    // Not valid — return the verdict so the scanner UI can show a clear reason
    return NextResponse.json({
      success: false,
      verdict: result.verdict,
      valid: false,
      message: result.message,
      ticket: result.ticket
        ? {
            id: result.ticket.id,
            status: result.ticket.status,
            checkedInAt: result.ticket.checkedInAt?.toISOString(),
            user: result.ticket.user,
            event: {
              id: result.ticket.event.id,
              title: result.ticket.event.title,
              date: result.ticket.event.date.toISOString(),
              venue: result.ticket.event.venue,
            },
          }
        : undefined,
    })
  } catch (error) {
    console.error('Error scanning ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function isEventAccessibleByRole(role: string): boolean {
  return SCANNER_ROLES.includes(role)
}

