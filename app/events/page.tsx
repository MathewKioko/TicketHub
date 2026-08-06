'use client'

import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Ticket, Search, Sparkles, Filter, Star, ArrowRight } from 'lucide-react'
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

const eventsCache = new Map<string, { data: Event[]; timestamp: number }>()
const CACHE_DURATION = 60000

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
    query: '', minDate: '', maxDate: '', minPrice: '', maxPrice: '', location: '', radius: '',
  })
  const searchDebounceRef = useRef<NodeJS.Timeout>()

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
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
      const cacheKey = url
      const cached = eventsCache.get(cacheKey)
      const now = Date.now()

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setEvents(cached.data)
        setLoading(false)
        return
      }

      const res = await fetch(url, { next: { revalidate: 60 } })
      const data = await res.json()
      const eventsData = data.events || []
      eventsCache.set(cacheKey, { data: eventsData, timestamp: now })
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [category, searchFilters])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => fetchEvents(), searchFilters.query ? 500 : 0)
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [searchFilters, fetchEvents])

  useEffect(() => { fetchEvents() }, [category])

  const categories = useMemo(() => [
    { name: 'All', icon: Sparkles }, { name: 'Music', icon: Ticket }, { name: 'Sports', icon: Calendar },
    { name: 'Theater', icon: MapPin }, { name: 'Conference', icon: Filter }, { name: 'Festival', icon: Star },
    { name: 'Workshop', icon: Filter }, { name: 'Other', icon: Sparkles },
  ], [])

  const handleCategoryChange = useCallback((cat: string) => setCategory(cat === 'All' ? '' : cat), [])

  const featuredEvent = events[0]
  const gridEvents = events.slice(1)

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe text-sm">Curating events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe">
      {/* Header */}
      <div className="bg-coal/60 backdrop-blur-xl border-b border-gold/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-0.5">The Collection</p>
              <h1 className="font-display text-2xl md:text-4xl font-bold text-ivory">
                Discover <span className="gradient-text italic">Events</span>
              </h1>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe/50" />
              <input
                type="text"
                placeholder="Search..."
                value={searchFilters.query}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-coal/70 border border-white/10 rounded-xl text-ivory text-sm placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {categories.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleCategoryChange(name)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  (name === 'All' && !category) || category === name
                    ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx'
                    : 'glass text-ivory/70 hover:bg-gold/10 hover:text-gold border border-white/10'
                }`}
              >
                <Icon className="w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <AdvancedSearch filters={searchFilters} onFiltersChange={setSearchFilters} />

        {/* Featured Event — compact horizontal */}
        {featuredEvent && (
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">Editor&apos;s Pick</p>
            <Link href={`/events/${featuredEvent.id}`} className="group block">
              <div className="luxe-card rounded-2xl overflow-hidden hover:scale-[1.005] transition-all duration-300 flex flex-col sm:flex-row">
                <div className="sm:w-2/5 relative overflow-hidden h-44 sm:h-auto">
                  {featuredEvent.imageUrl ? (
                    <img
                      src={featuredEvent.imageUrl}
                      alt={featuredEvent.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-ash to-coal flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gold/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/20 to-transparent" />
                  <span className="absolute top-3 left-3 pill-gold text-[10px]">{featuredEvent.category}</span>
                </div>
                <div className="sm:w-3/5 p-5 flex flex-col justify-center">
                  <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors line-clamp-1">
                    {featuredEvent.title}
                  </h3>
                  <p className="text-taupe text-xs mt-1 line-clamp-2 font-light">{featuredEvent.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-ivory/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gold/60" />
                      {format(new Date(featuredEvent.date), 'MMM dd, h:mm a')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gold/60" />
                      {featuredEvent.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Ticket className="w-3 h-3 text-gold/60" />
                      {featuredEvent._count.tickets} tickets
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 divider-gold">
                    <span className="text-xs text-gold font-semibold">KES {featuredEvent.basePrice.toLocaleString()}</span>
                    <span className="text-xs text-taupe">by {featuredEvent.organizer.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Events Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-ivory">
              The <span className="gradient-text italic">Collection</span>
            </h2>
            <span className="text-xs text-taupe">{events.length} events</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>

        {events.length === 0 && (
          <div className="glass-luxe rounded-2xl p-10 text-center mt-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
            <p className="font-display text-lg text-ivory font-bold mb-1">No events found</p>
            <p className="text-taupe text-sm">Try a different category or refine your search</p>
          </div>
        )}
      </div>
    </div>
  )
}

const EventCard = memo(({ event, index }: { event: Event; index: number }) => {
  const formattedDate = useMemo(() => format(new Date(event.date), 'MMM dd, yyyy • h:mm a'), [event.date])
  const formattedPrice = useMemo(() => `KES ${event.basePrice.toLocaleString()}`, [event.basePrice])

  return (
    <div style={{ height: '100%' }}>
      <Link href={`/events/${event.id}`}>
        <div className="luxe-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all duration-300 cursor-pointer h-full card-hover group">
          {event.imageUrl ? (
            <div className="relative overflow-hidden">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/20 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="pill-gold text-[10px]">{event.category}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 bg-onyx/80 backdrop-blur-sm text-gold-light text-[10px] font-semibold rounded-full border border-gold/25">
                  {formattedPrice}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gradient-to-br from-ash to-coal h-36 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gold/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-onyx via-transparent to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="pill-gold text-[10px]">{event.category}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 bg-onyx/80 backdrop-blur-sm text-gold-light text-[10px] font-semibold rounded-full border border-gold/25">
                  {formattedPrice}
                </span>
              </div>
            </div>
          )}
          <div className="p-4">
            <h3 className="font-display text-base font-bold text-ivory mb-1 group-hover:text-gold transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-taupe text-xs mb-3 line-clamp-2 font-light leading-relaxed">
              {event.description}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-ivory/70">
                <Calendar className="w-3 h-3 text-gold/60 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-ivory/70">
                <MapPin className="w-3 h-3 text-gold/60 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>
            <div className="pt-3 mt-3 divider-gold flex items-center justify-between">
              <span className="text-[10px] text-taupe">by {event.organizer.name}</span>
              <span className="text-[10px] text-ivory/50">{event._count.tickets} sold</span>
            </div>
            <div className="mt-3">
              <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx text-sm font-semibold hover:shadow-glow-lg hover:scale-[1.02] transition-all duration-200 group-hover:shadow-glow-lg">
                Buy Tickets
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
})
EventCard.displayName = 'EventCard'
