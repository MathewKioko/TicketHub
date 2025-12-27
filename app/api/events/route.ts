import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CacheService } from '@/lib/redis'
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
    const where: any = {}
    
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
    
    // Text search (title, description, venue) and location search - MongoDB regex for case-insensitive
    const queryRegex = query ? { $regex: query, $options: 'i' } as any : null
    const locationRegex = location ? { $regex: location, $options: 'i' } as any : null

    // Build OR conditions for text search and location
    const orConditions: any[] = []

    if (queryRegex) {
      orConditions.push(
        { title: queryRegex },
        { description: queryRegex },
        { venue: queryRegex }
      )
    }

    if (locationRegex) {
      orConditions.push({ venue: locationRegex })
    }

    if (orConditions.length > 0) {
      where.OR = orConditions
    }
    
    // Handle organizerId filter
    if (organizerIdParam && organizerIdParam !== 'me') {
      where.organizerId = organizerIdParam
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

    // Add confirmed ticket counts to each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const confirmedTicketsCount = await prisma.ticket.count({
          where: {
            eventId: event.id,
            status: {
              in: ['CONFIRMED', 'CHECKED_IN'],
            },
          },
        })

        return {
          ...event,
          _count: {
            tickets: confirmedTicketsCount,
          },
        }
      })
    )

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
    const body = await request.json()
    const data = createEventSchema.parse(body)

    // Get or create guest organizer user with valid MongoDB ObjectID
    const GUEST_ORGANIZER_EMAIL = 'organizer@Ticket Hub.local'
    const GUEST_ORGANIZER_NAME = 'Guest Organizer'
    
    let organizerUser = await prisma.user.findUnique({
      where: { email: GUEST_ORGANIZER_EMAIL },
    })
    
    if (!organizerUser) {
      // Create guest organizer user if doesn't exist
      organizerUser = await prisma.user.create({
        data: {
          email: GUEST_ORGANIZER_EMAIL,
          name: GUEST_ORGANIZER_NAME,
          role: 'ORGANIZER',
        },
      })
    }
    
    const organizerId = organizerUser.id

    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        organizerId: organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Invalidate events cache when new event is created (BEAST LEVEL: Cache invalidation)
    const cacheAvailable = await CacheService.isAvailable()
    if (cacheAvailable) {
      await CacheService.delPattern('events:*')
      console.log('🗑️ Cache invalidated for events:*')
    }

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

