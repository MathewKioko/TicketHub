import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // published, draft, suspended, all
    const organizerId = searchParams.get('organizerId')
    const search = searchParams.get('search')

    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (organizerId) where.organizerId = organizerId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Admin events error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { eventId, action, reason } = body // action: 'approve' | 'reject' | 'suspend' | 'reactivate'

    if (!eventId || !action) {
      return NextResponse.json({ error: 'Event ID and action are required' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    let updateData: any = {}
    let message: string

    switch (action) {
      case 'approve':
        updateData = { status: 'PUBLISHED' }
        message = 'Event approved and published'
        break
      case 'reject':
        updateData = { status: 'CANCELLED' }
        message = 'Event rejected'
        break
      case 'suspend':
        updateData = { status: 'SUSPENDED' }
        message = 'Event suspended'
        break
      case 'reactivate':
        updateData = { status: 'PUBLISHED' }
        message = 'Event reactivated'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (reason) updateData.description = `${event.description}\n\n[Admin Moderation: ${action}] ${reason}`

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: { organizer: { select: { id: true, name: true, email: true } } },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: `ADMIN_EVENT_${action.toUpperCase()}`,
        resource: 'event',
        resourceId: eventId,
        details: JSON.stringify({
          eventId,
          eventTitle: event.title,
          action,
          reason,
          changedBy: currentUser.email,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ success: true, event: updatedEvent, message })
  } catch (error) {
    console.error('Admin event moderation error:', error)
    return NextResponse.json({ error: 'Failed to moderate event' }, { status: 500 })
  }
}