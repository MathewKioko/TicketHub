'use client'

import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Calendar, MapPin, Ticket, Search, Sparkles, Filter } from 'lucide-react'
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
      
      // Build query parameters
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
        next: { revalidate: 60 }
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

  // Debounce search filters
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    
    searchDebounceRef.current = setTimeout(() => {
      fetchEvents()
    }, searchFilters.query ? 500 : 0)
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchFilters, fetchEvents])

  // Fetch immediately when category changes
  useEffect(() => {
    fetchEvents()
  }, [category])

  // Handle responsive column count
  useEffect(() => {
    const updateColumnCount = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      if (width < 768) {
        setColumnCount(1)
      } else if (width < 1024) {
        setColumnCount(2)
      } else {
        setColumnCount(3)
      }
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  const categories = useMemo(() => [
    { name: 'All', icon: Sparkles },
    { name: 'Music', icon: Ticket },
    { name: 'Sports', icon: Calendar },
    { name: 'Theater', icon: MapPin },
    { name: 'Conference', icon: Filter },
    { name: 'Festival', icon: Search },
    { name: 'Workshop', icon: Filter },
    { name: 'Other', icon: Sparkles },
  ], [])

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat === 'All' ? '' : cat)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-kenyan-green/30 border-t-kenyan-green rounded-full animate-spin" />
          <p className="text-kenyan-cream/60">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <div className="bg-kenyan-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                Discover <span className="gradient-text">Events</span>
              </h1>
              <p className="text-kenyan-cream/60">Find amazing events across Kenya</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kenyan-cream/40" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchFilters.query}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 glass rounded-xl text-kenyan-cream placeholder-kenyan-cream/40 border border-white/10 focus:border-kenyan-green/50 focus:outline-none focus:ring-2 focus:ring-kenyan-green/20 transition-all"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleCategoryChange(name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  (name === 'All' && !category) || category === name
                    ? 'bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white shadow-lg shadow-kenyan-green/30'
                    : 'glass text-kenyan-cream/80 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Advanced Search Component */}
        <AdvancedSearch
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
        />

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

        {events.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center mt-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-kenyan-green/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-kenyan-green" />
            </div>
            <p className="text-xl text-white font-semibold mb-2">No events found</p>
            <p className="text-kenyan-cream/60">Try selecting a different category or adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoized Event Card Component
const EventCard = memo(({ event, index }: { event: Event; index: number }) => {
  const formattedDate = useMemo(() => format(new Date(event.date), 'MMM dd, yyyy • h:mm a'), [event.date])
  const formattedPrice = useMemo(() => `KES ${event.basePrice.toLocaleString()}`, [event.basePrice])

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, height: '100%' }}>
      <Link href={`/events/${event.id}`}>
        <div className="glass-dark rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-500 cursor-pointer h-full card-hover group">
          {/* Image */}
          {event.imageUrl && (
            <div className="relative overflow-hidden -mx-6 -mt-6 mb-4">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-48 object-cover transition-transform duration-1000 group-hover:scale-125"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kenyan-black/80 via-kenyan-black/20 to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-kenyan-green/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                  {event.category}
                </span>
              </div>

              {/* Price Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-kenyan-gold/90 backdrop-blur-sm text-kenyan-black text-xs font-bold rounded-full">
                  {formattedPrice}
                </span>
              </div>
            </div>
          )}

          <div className="p-5">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-kenyan-gold transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-kenyan-cream/70 text-sm mb-4 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-kenyan-cream/80">
                <Calendar className="w-4 h-4 text-kenyan-green flex-shrink-0" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-3 text-kenyan-cream/80">
                <MapPin className="w-4 h-4 text-kenyan-gold flex-shrink-0" />
                <span className="font-medium truncate">{event.venue}</span>
              </div>
              <div className="flex items-center gap-3 text-kenyan-cream/80">
                <Ticket className="w-4 h-4 text-kenyan-red flex-shrink-0" />
                <span className="font-medium">{event._count.tickets} tickets available</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-kenyan-cream/60">By</span>
                <span className="text-sm font-bold text-kenyan-gold">
                  {event.organizer.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
})

EventCard.displayName = 'EventCard'
