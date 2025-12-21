import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateTicketId, generateQRCode } from '@/lib/qrcode'
import { z } from 'zod'

const createTicketSchema = z.object({
  eventId: z.string(),
  quantity: z.number().min(1).default(1),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, quantity, guestName, guestEmail } = createTicketSchema.parse(body)
    
    // Get or create guest user with valid MongoDB ObjectID
    // Use a single guest account for all anonymous bookings
    const GUEST_EMAIL = 'guest@Ticket Hub.local'
    const GUEST_NAME = 'Guest User'
    
    let guestUser = await prisma.user.findUnique({
      where: { email: GUEST_EMAIL },
    })
    
    if (!guestUser) {
      // Create guest user if doesn't exist
      guestUser = await prisma.user.create({
        data: {
          email: GUEST_EMAIL,
          name: GUEST_NAME,
          role: 'ATTENDEE',
        },
      })
    }
    
    const userId = guestUser.id

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Calculate price
    const price = event.basePrice

    // Get base URL for QR code URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate ticket data (create tickets first to get IDs, then generate QR codes)
    const ticketData = []
    for (let i = 0; i < quantity; i++) {
      const ticketId = generateTicketId()
      // Store both old format (for scanner) and will add URL format
      const qrCodeData = `${eventId}:${ticketId}:${userId}`

      ticketData.push({
        eventId,
        userId: userId,
        price,
        qrCodeData,
        status: 'PENDING' as const,
        // Explicitly omit stripePaymentId and stripeSessionId to avoid unique constraint issues
      })
    }

    // Create tickets using createMany
    await prisma.ticket.createMany({
      data: ticketData,
    })

    // Fetch the created tickets to get their IDs
    const createdTickets = await prisma.ticket.findMany({
      where: {
        eventId,
        userId: userId,
        qrCodeData: { in: ticketData.map(t => t.qrCodeData) },
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: quantity,
    })

    // Generate QR codes with ticket receipt URLs
    const tickets = await Promise.all(
      createdTickets.map(async (ticket) => {
        // Create URL that opens ticket receipt page
        const ticketUrl = `${baseUrl}/tickets/${ticket.id}`
        console.log(`Generating QR code for ticket ${ticket.id} with URL: ${ticketUrl}`)
        
        // Generate QR code with the URL
        const qrCodeImage = await generateQRCode(ticketUrl)

        // Update ticket with QR code image
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticket.id },
          data: { qrCodeImage },
        })

        return updatedTicket
      })
    )

    // Emit real-time ticket count update via Socket.IO (BEAST LEVEL: Real-time updates)
    try {
      const { getSocketIO } = await import('@/lib/socket')
      const socketIO = getSocketIO()
      if (socketIO) {
        const confirmedCount = await prisma.ticket.count({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
        })
        const { emitTicketCountUpdate } = await import('@/lib/socket')
        emitTicketCountUpdate(eventId, confirmedCount)
      }
    } catch (socketError) {
      // Don't fail ticket creation if Socket.IO fails
      console.warn('Socket.IO update failed:', socketError)
    }

    return NextResponse.json({ tickets, userId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

