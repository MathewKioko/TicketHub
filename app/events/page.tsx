'use client'

import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Calendar, MapPin, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { AdvancedSearch } from '@/components/events/AdvancedSearch'

interface Event {
  id: string
  title: string
  description: string
  venue: string
  date: string
  category: string
  imageUrl?: string
  basePrice: number
  organizer: {
    name: string
  }
  _count: {
    tickets: number
  }
}

// Client-side cache for events
const eventsCache = new Map<string, { data: Event[]; timestamp: number }>()
const CACHE_DURATION = 60000 // 60 seconds

interface SearchFilters {
  query: string
  minDate: string
  maxDate: string
  minPrice: string
  maxPrice: string
  location: string
  radius: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    minDate: '',
    maxDate: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    radius: '',
  })
  const [columnCount, setColumnCount] = useState(3)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout>()

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query parameters (BEAST LEVEL: Advanced filtering)
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (searchFilters.query) params.append('query', searchFilters.query)
      if (searchFilters.minDate) params.append('minDate', searchFilters.minDate)
      if (searchFilters.maxDate) params.append('maxDate', searchFilters.maxDate)
      if (searchFilters.minPrice) params.append('minPrice', searchFilters.minPrice)
      if (searchFilters.maxPrice) params.append('maxPrice', searchFilters.maxPrice)
      if (searchFilters.location) params.append('location', searchFilters.location)
      if (searchFilters.radius) params.append('radius', searchFilters.radius)
      
      const url = `/api/events?${params.toString()}`
      
      // Check cache first
      const cacheKey = url
      const cached = eventsCache.get(cacheKey)
      const now = Date.now()
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setEvents(cached.data)
        setLoading(false)
        return
      }
      
      const res = await fetch(url, {
        next: { revalidate: 60 } // Next.js caching
      })
      const data = await res.json()
      const eventsData = data.events || []
      
      // Update cache
      eventsCache.set(cacheKey, { data: eventsData, timestamp: now })
      
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [category, searchFilters])

  // Debounce search filters to avoid too many API calls
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    
    searchDebounceRef.current = setTimeout(() => {
      fetchEvents()
    }, searchFilters.query ? 500 : 0) // 500ms debounce for text search
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchFilters, fetchEvents])

  // Fetch immediately when category changes (no debounce)
  useEffect(() => {
    fetchEvents()
  }, [category])

  // Handle responsive column count for virtual scrolling
  useEffect(() => {
    const updateColumnCount = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      if (width < 768) {
        setColumnCount(1) // Mobile: 1 column
      } else if (width < 1024) {
        setColumnCount(2) // Tablet: 2 columns
      } else {
        setColumnCount(3) // Desktop: 3 columns
      }
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  const categories = useMemo(() => [
    'All',
    'Music',
    'Sports',
    'Theater',
    'Conference',
    'Festival',
    'Workshop',
    'Other',
  ], [])

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat === 'All' ? '' : cat)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-2">
            Discover <span className="gradient-text">Events</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">Find amazing events happening near you</p>

          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-white text-gray-700 hover:bg-primary-50 hover:border-primary-300 border-2 border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
        />

        {/* Regular Grid - Virtual scrolling disabled for build compatibility */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

        {events.length === 0 && (
          <Card variant="elevated" className="text-center py-16 animate-fade-in-up">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 text-xl font-semibold mb-2">No events found</p>
            <p className="text-gray-500">Try selecting a different category</p>
          </Card>
        )}
      </div>
    </div>
  )
}

// Memoized Event Card Component for Performance
const EventCard = memo(({ event, index }: { event: Event; index: number }) => {
  const formattedDate = useMemo(() => format(new Date(event.date), 'MMM dd, yyyy • h:mm a'), [event.date])
  const formattedPrice = useMemo(() => `$${event.basePrice.toFixed(2)}`, [event.basePrice])

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, height: '100%' }}>
      <Link href={`/events/${event.id}`}>
        <Card variant="elevated" className="hover:shadow-glow-xl transition-all duration-700 cursor-pointer h-full hover-lift group shine premium-border">
          {event.imageUrl && (
            <div className="relative overflow-hidden rounded-xl mb-4 -mx-6 -mt-6">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-48 object-cover transition-transform duration-1000 group-hover:scale-125"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-700" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">{event.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className="font-medium">{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-500" />
                <span className="font-bold text-lg gradient-text">{formattedPrice}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <span className="text-sm text-primary-600 font-bold">
                {event.organizer.name}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
})

EventCard.displayName = 'EventCard'

