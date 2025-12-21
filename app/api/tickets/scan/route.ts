import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only organizers can scan tickets
    if (user.role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { qrCodeData } = body

    if (!qrCodeData) {
      return NextResponse.json(
        { error: 'QR code data required' },
        { status: 400 }
      )
    }

    let ticket

    // Check if it's a URL format (new format)
    if (qrCodeData.includes('/tickets/')) {
      // Extract ticket ID from URL
      const ticketIdMatch = qrCodeData.match(/\/tickets\/([^/?]+)/)
      if (ticketIdMatch) {
        const ticketId = ticketIdMatch[1]
        ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          include: {
            event: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            checkIn: true,
          },
        })
      }
    } else {
      // Old format: eventId:ticketId:userId
      const parts = qrCodeData.split(':')
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid QR code format' },
          { status: 400 }
        )
      }

      // Find ticket by qrCodeData (old format)
      ticket = await prisma.ticket.findUnique({
        where: { qrCodeData },
        include: {
          event: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          checkIn: true,
        },
      })
    }


    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify event belongs to organizer
    if (ticket.event.organizerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already checked in
    if (ticket.checkIn) {
      return NextResponse.json({
        success: false,
        error: 'Ticket already checked in',
        ticket: {
          id: ticket.id,
          checkedInAt: ticket.checkIn.checkedInAt.toISOString(),
          user: ticket.user,
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
            date: ticket.event.date.toISOString(),
          },
          status: ticket.status,
        },
      })
    }

    // Check ticket status
    if (ticket.status !== 'CONFIRMED') {
      return NextResponse.json({
        success: false,
        error: `Ticket status is ${ticket.status}. Must be CONFIRMED.`,
        ticket: {
          id: ticket.id,
          status: ticket.status,
        },
      })
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        scannerId: user.id,
      },
    })

    // Update ticket status
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket checked in successfully',
      ticket: {
        id: ticket.id,
        user: ticket.user,
        event: {
          id: ticket.event.id,
          title: ticket.event.title,
          date: ticket.event.date.toISOString(),
        },
        status: 'CHECKED_IN',
        checkedInAt: checkIn.checkedInAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error scanning ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

