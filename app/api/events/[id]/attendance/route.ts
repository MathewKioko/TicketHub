import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, ORGANIZER_ROLES } from '@/lib/auth'

/**
 * Attendance for one event: the check-in log plus honest figures.
 * Sold counts both CONFIRMED and CHECKED_IN tickets, because attendees who
 * have already entered are still part of the denominator.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!ORGANIZER_ROLES.includes(user.role as (typeof ORGANIZER_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true, organizerId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Admins can review any event; organizers only their own.
    if (event.organizerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { eventId: params.id },
      include: {
        ticket: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    })

    const totalTickets = await prisma.ticket.count({
      where: {
        eventId: params.id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    })

    const checkedInCount = checkIns.length
    const attendanceRate = totalTickets > 0 ? (checkedInCount / totalTickets) * 100 : 0

    return NextResponse.json({
      checkIns,
      stats: {
        totalTickets,
        checkedInCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
