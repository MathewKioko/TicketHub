import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOrganizer } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireOrganizer()

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event || event.organizerId !== user.id) {
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
        status: 'CONFIRMED',
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

