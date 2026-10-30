import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CacheService } from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  venue: z.string().min(1),
  date: z.string(),
  endDate: z.string().optional(),
  category: z.string(),
  imageUrl: z.string().optional(),
  basePrice: z.number().min(0).default(0),
  currency: z.string().default('USD'),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const date = searchParams.get('date')
    const organizerIdParam = searchParams.get('organizerId')
    
    // Advanced search filters (BEAST LEVEL: Production-grade filtering)
    const query = searchParams.get('query')
    const minDate = searchParams.get('minDate')
    const maxDate = searchParams.get('maxDate')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const radius = searchParams.get('radius')

    // Generate cache key based on ALL query parameters
    const cacheKey = `events:${category || 'all'}:${date || 'all'}:${organizerIdParam || 'all'}:${query || 'all'}:${minDate || 'all'}:${maxDate || 'all'}:${minPrice || 'all'}:${maxPrice || 'all'}:${location || 'all'}`
    
    // Try to get from Redis cache first
    const cacheAvailable = await CacheService.isAvailable()
    if (cacheAvailable) {
      const cachedEvents = await CacheService.get<any[]>(cacheKey)
      if (cachedEvents) {
        console.log(`✅ Cache HIT for ${cacheKey}`)
        const response = NextResponse.json({ events: cachedEvents })
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
        response.headers.set('X-Cache', 'HIT')
        return response
      }
      console.log(`❌ Cache MISS for ${cacheKey}`)
    }

    // Build Prisma where clause with advanced filters
    const where: any = {
      // Public portal only shows published events
      status: 'PUBLISHED',
    }
    
    // Category filter
    if (category) where.category = category
    
    // Date filters
    if (date) {
      const dateObj = new Date(date)
      where.date = { gte: dateObj }
    } else {
      if (minDate || maxDate) {
        where.date = {}
        if (minDate) where.date.gte = new Date(minDate)
        if (maxDate) where.date.lte = new Date(maxDate)
      }
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      where.basePrice = {}
      if (minPrice) where.basePrice.gte = parseFloat(minPrice)
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice)
    }
    
    // Text search (title, description, venue) and location search.
    // Prisma owns the filter shape: raw Mongo operators like { $regex } are not
    // valid `where` input and used to throw a 500 on every search. `contains`
    // with `mode: 'insensitive'` compiles to a case-insensitive Mongo regex.
    const textMatch = (value: string) => ({ contains: value, mode: 'insensitive' as const })

    const orConditions: any[] = []

    if (query) {
      orConditions.push(
        { title: textMatch(query) },
        { description: textMatch(query) },
        { venue: textMatch(query) },
        // Typing "comedy" should find the comedy night, whose title does not
        // contain the word.
        { category: textMatch(query) }
      )
    }

    if (location) {
      orConditions.push({ venue: textMatch(location) })
    }

    if (orConditions.length > 0) {
      where.OR = orConditions
    }
    
    // Handle organizerId filter
    if (organizerIdParam) {
      if (organizerIdParam === 'me') {
        // "me" must resolve to the caller. Never fall through to an unfiltered
        // list, which would show every organizer another organizer's events.
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        where.organizerId = currentUser.id
      } else {
        where.organizerId = organizerIdParam
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Add confirmed ticket counts to each event in a single grouped query,
    // rather than one count per event.
    const ticketCounts = await prisma.ticket.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: events.map((event) => event.id) },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
      _count: { _all: true },
    })

    const countsByEvent = Object.fromEntries(
      ticketCounts.map((row) => [row.eventId, row._count._all])
    )

    const eventsWithCounts = events.map((event) => ({
      ...event,
      _count: { tickets: countsByEvent[event.id] ?? 0 },
    }))

    // Cache in Redis for 5 minutes (300 seconds) - BEAST LEVEL caching
    if (cacheAvailable) {
      await CacheService.set(cacheKey, eventsWithCounts, 300)
    }

    // Add caching headers for performance
    const response = NextResponse.json({ events: eventsWithCounts })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    response.headers.set('X-Cache', 'MISS')
    
    return response
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = createEventSchema.parse(body)
    
    const organizerId = currentUser.id
    
    // Check if user is verified organizer for auto-publish
    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true, verified: true }
    })
    
    // Auto-publish if user is ADMIN or verified EVENT_OWNER/ORGANIZER
    const isAutoPublish = currentUser.role === 'ADMIN' ||
      (currentUser.role === 'EVENT_OWNER' && currentUser.verified === true) ||
      (currentUser.role === 'ORGANIZER' && currentUser.verified === true)

    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        organizerId: organizerId,
        status: isAutoPublish ? 'PUBLISHED' : 'PENDING', // Auto-publish if verified
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}  