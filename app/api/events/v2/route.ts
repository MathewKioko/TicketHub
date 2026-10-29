import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'

// Ticket type configuration
export interface TicketTypeConfig {
  type: 'REGULAR' | 'VIP' | 'VIP_PLATINUM' | 'EARLY_BIRD' | 'STUDENT' | 'GROUP'
  name: string
  price: number
  quantity: number
  description?: string
  earlyBirdDeadline?: string
  groupMinSize?: number
}

// POST /api/events/v2 - Create event with multiple ticket types (v2)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can create events
    if (!['EVENT_OWNER', 'ORGANIZER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create events' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      venue,
      date,
      endDate,
      imageUrl,
      category,
      currency = 'KES',
      status = 'DRAFT',
      ticketTypes,
      settings,
    } = body

    // Validate required fields
    if (!title || !venue || !date || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, venue, date, category' },
        { status: 400 }
      )
    }

    // Validate ticket types if provided
    let parsedTicketTypes: TicketTypeConfig[] = []
    if (ticketTypes && Array.isArray(ticketTypes)) {
      parsedTicketTypes = ticketTypes.map((tt: any) => ({
        type: tt.type || 'REGULAR',
        name: tt.name || tt.type,
        price: Number(tt.price) || 0,
        quantity: Number(tt.quantity) || 100,
        description: tt.description,
        earlyBirdDeadline: tt.earlyBirdDeadline,
        groupMinSize: tt.groupMinSize,
      }))
    } else {
      // Default ticket type
      parsedTicketTypes = [{
        type: 'REGULAR',
        name: 'General Admission',
        price: 0,
        quantity: 100,
      }]
    }

    // Calculate total tickets
    const totalTickets = parsedTicketTypes.reduce(
      (sum: number, tt: TicketTypeConfig) => sum + tt.quantity,
      0
    )

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        venue,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        imageUrl: imageUrl || null,
        category,
        organizerId: currentUser.id,
        currency,
        status: status as any,
        ticketTypes: parsedTicketTypes as any,
        totalTickets,
        ticketsSold: 0,
        totalRevenue: 0,
        settings: settings || {},
      },
    })

    // Create audit log
    await audit.event.create(currentUser.id, event.id)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Create event v2 error:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

// GET /api/events/v2 - List events with filters (v2)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Filters
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'PUBLISHED'
    const organizerId = searchParams.get('organizerId')
    const search = searchParams.get('search')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status,
    }

    if (category) where.category = category
    if (organizerId) where.organizerId = organizerId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    // Get events
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          organizer: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ])

    // Get ticket types from each event
    const eventsWithTicketTypes = events.map((event: any) => ({
      ...event,
      ticketTypes: (event.ticketTypes as unknown as TicketTypeConfig[]) || [],
      availableTickets: event.totalTickets - event.ticketsSold,
    }))

    return NextResponse.json({
      events: eventsWithTicketTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List events v2 error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
