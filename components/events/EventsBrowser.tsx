'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { EventRow } from '@/components/events/EventRow'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { rangeForParam } from '@/lib/date-range'
import { asDate, formatNumber, pluralise } from '@/lib/format'
import { EVENT_CATEGORIES } from '@/lib/site'
import type { EventSummary } from '@/lib/types'

interface Filters {
  query: string
  category: string
  location: string
  minPrice: string
  maxPrice: string
  minDate: string
  maxDate: string
}

interface RawEvent extends EventSummary {
  _count?: { tickets?: number }
}

function toSummary(raw: RawEvent): EventSummary {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    venue: raw.venue,
    category: raw.category,
    imageUrl: raw.imageUrl ?? null,
    basePrice: raw.basePrice ?? 0,
    currency: raw.currency ?? 'KES',
    status: raw.status ?? 'PUBLISHED',
    organizerId: raw.organizerId,
    organizerName: raw.organizerName ?? 'Organizer',
    sold: raw._count?.tickets ?? raw.sold ?? 0,
    capacity: raw.capacity ?? 0,
  }
}

function groupByDay(events: EventSummary[]) {
  const groups = new Map<string, { key: string; label: string; weekday: string; events: EventSummary[] }>()
  for (const event of events) {
    const date = asDate(event.date)
    if (!date) continue
    const key = date.toISOString().slice(0, 10)
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, {
        key,
        label: format(date, 'd MMM'),
        weekday: format(date, 'EEEE'),
        events: [event],
      })
    }
  }
  return Array.from(groups.values())
}

const ACTIVE_FILTER_COUNT = (filters: Filters): number =>
  [filters.query, filters.category, filters.location, filters.minPrice, filters.maxPrice, filters.minDate].filter(
    (value) => value.trim().length > 0
  ).length

export function EventsBrowser() {
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filters>(() => {
    const range = rangeForParam(searchParams.get('when'))
    return {
      query: searchParams.get('query') ?? '',
      category: searchParams.get('category') ?? '',
      location: searchParams.get('location') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      minDate: range.minDate ?? '',
      maxDate: range.maxDate ?? '',
    }
  })
  const [sort, setSort] = useState<'soonest' | 'price'>('soonest')
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cache = useRef(new Map<string, { at: number; events: EventSummary[] }>())

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filters.query), 350)
    return () => clearTimeout(timer)
  }, [filters.query])

  // The initial state above runs once. When the URL changes without a remount —
  // footer links, browser back/forward, a second search from the homepage — the
  // filters used to go stale and the results silently stopped matching the URL.
  const appliedParams = useRef(searchParams.toString())
  useEffect(() => {
    const paramsKey = searchParams.toString()
    if (paramsKey === appliedParams.current) return
    appliedParams.current = paramsKey
    const range = rangeForParam(searchParams.get('when'))
    const nextQuery = searchParams.get('query') ?? ''
    setFilters({
      query: nextQuery,
      category: searchParams.get('category') ?? '',
      location: searchParams.get('location') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      minDate: range.minDate ?? '',
      maxDate: range.maxDate ?? '',
    })
    setDebouncedQuery(nextQuery)
  }, [searchParams])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedQuery.trim()) params.set('query', debouncedQuery.trim())
    if (filters.category) params.set('category', filters.category)
    if (filters.location.trim()) params.set('location', filters.location.trim())
    if (filters.minPrice.trim()) params.set('minPrice', filters.minPrice.trim())
    if (filters.maxPrice.trim()) params.set('maxPrice', filters.maxPrice.trim())
    if (filters.minDate) params.set('minDate', filters.minDate)
    if (filters.maxDate) params.set('maxDate', filters.maxDate)
    return params.toString()
  }, [debouncedQuery, filters])

  const load = useCallback(async (key: string) => {
    const cached = cache.current.get(key)
    if (cached && Date.now() - cached.at < 60_000) {
      setEvents(cached.events)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events${key ? `?${key}` : ''}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Could not load events. Try again in a moment.')
      const data = (await response.json()) as { events?: RawEvent[] }
      const list = (data.events ?? [])
        .map(toSummary)
        .filter((event) => event.status !== 'DRAFT')
      cache.current.set(key, { at: Date.now(), events: list })
      setEvents(list)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load events.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(queryString)
  }, [load, queryString])

  const sortedEvents = useMemo(() => {
    if (sort === 'price') {
      return [...events].sort((a, b) => a.basePrice - b.basePrice)
    }
    return [...events].sort((a, b) => (asDate(a.date)?.getTime() ?? 0) - (asDate(b.date)?.getTime() ?? 0))
  }, [events, sort])

  const groups = useMemo(() => groupByDay(sortedEvents), [sortedEvents])
  const activeFilters = ACTIVE_FILTER_COUNT(filters)

  /**
   * Filters are combined with AND, so a search term left in the box quietly
   * narrows every category chip. Showing what is applied, each with its own
   * remove control, is what makes that visible.
   */
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onClear: () => void }> = []
    const reset = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }))

    const query = filters.query.trim()
    if (query) {
      chips.push({
        id: 'query',
        label: `Search: “${query}”`,
        onClear: () => {
          reset({ query: '' })
          setDebouncedQuery('')
        },
      })
    }
    if (filters.category) {
      chips.push({ id: 'category', label: filters.category, onClear: () => reset({ category: '' }) })
    }
    if (filters.location.trim()) {
      chips.push({
        id: 'location',
        label: `Near ${filters.location.trim()}`,
        onClear: () => reset({ location: '' }),
      })
    }
    if (filters.minPrice.trim() || filters.maxPrice.trim()) {
      chips.push({
        id: 'price',
        label: `KES ${filters.minPrice.trim() || '0'}–${filters.maxPrice.trim() || 'any'}`,
        onClear: () => reset({ minPrice: '', maxPrice: '' }),
      })
    }
    if (filters.minDate) {
      chips.push({ id: 'date', label: 'Date range', onClear: () => reset({ minDate: '', maxDate: '' }) })
    }

    return chips
  }, [filters])

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function clearAll() {
    setFilters({
      query: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      minDate: '',
      maxDate: '',
    })
    setDebouncedQuery('')
  }

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="browse-query" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
          Search
        </label>
        <input
          id="browse-query"
          value={filters.query}
          onChange={(event) => update('query', event.target.value)}
          placeholder="Event, venue or organizer"
          className="field"
        />
      </div>

      <section className="border-t border-line pt-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">When</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: 'Today', value: 'today' },
            { label: 'This weekend', value: 'weekend' },
            { label: 'Next 7 days', value: 'week' },
          ].map((option) => {
            const range = rangeForParam(option.value)
            const active = filters.minDate === range.minDate
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilters((current) => ({
                    ...current,
                    minDate: active ? '' : range.minDate ?? '',
                    maxDate: active ? '' : range.maxDate ?? '',
                  }))
                }}
                aria-pressed={active}
                className={
                  active
                    ? 'border border-ink bg-ink px-2.5 py-1.5 text-xs font-medium text-bone'
                    : 'border border-line px-2.5 py-1.5 text-xs hover:border-slate'
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="border-t border-line pt-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">Category</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((category) => {
            const active = filters.category === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => update('category', active ? '' : category)}
                aria-pressed={active}
                className={
                  active
                    ? 'border border-ink bg-ink px-2.5 py-1.5 text-xs font-medium text-bone'
                    : 'border border-line px-2.5 py-1.5 text-xs hover:border-slate'
                }
              >
                {category}
              </button>
            )
          })}
        </div>
      </section>

      <section className="border-t border-line pt-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">Price (KES)</h2>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="browse-min-price">
            Minimum price
          </label>
          <input
            id="browse-min-price"
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(event) => update('minPrice', event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Min"
            className="field tnum"
          />
          <span aria-hidden className="text-slate">
            –
          </span>
          <label className="sr-only" htmlFor="browse-max-price">
            Maximum price
          </label>
          <input
            id="browse-max-price"
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(event) => update('maxPrice', event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Max"
            className="field tnum"
          />
        </div>
      </section>

      <section className="border-t border-line pt-5">
        <label htmlFor="browse-location" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
          Venue or area
        </label>
        <input
          id="browse-location"
          value={filters.location}
          onChange={(event) => update('location', event.target.value)}
          placeholder="e.g. Westlands"
          className="field"
        />
      </section>

      {activeFilters > 0 ? (
        <button type="button" onClick={clearAll} className="text-xs font-medium underline decoration-flame decoration-[1.5px] underline-offset-4">
          Clear all filters
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[42px]">Events in Nairobi</h1>
          <p className="tnum mt-2 text-[13px] text-slate" aria-live="polite">
            {loading
              ? 'Searching…'
              : activeFilters > 0
                ? `Matching filters: ${pluralise(sortedEvents.length, 'event')}`
                : `${pluralise(sortedEvents.length, 'event')} on sale`}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[13px]">
          <button
            type="button"
            onClick={() => setSort('soonest')}
            aria-pressed={sort === 'soonest'}
            className={sort === 'soonest' ? 'bg-shell px-3 py-1.5 font-medium' : 'px-3 py-1.5 text-slate hover:text-ink'}
          >
            Soonest first
          </button>
          <button
            type="button"
            onClick={() => setSort('price')}
            aria-pressed={sort === 'price'}
            className={sort === 'price' ? 'bg-shell px-3 py-1.5 font-medium' : 'px-3 py-1.5 text-slate hover:text-ink'}
          >
            Lowest price
          </button>
        </div>
      </div>

      <div className="mt-4 md:hidden">
        <Button variant="ghost" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
          Filters {activeFilters > 0 ? `(${activeFilters})` : ''}
        </Button>
      </div>

      {filtersOpen ? (
        <div className="mt-4 border border-line bg-paper p-4 md:hidden">{filterPanel}</div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[228px_1fr] lg:gap-14">
        <aside className="hidden md:block">
          <div className="sticky top-6">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          {error ? (
            <Notice
              tone="danger"
              title="Events could not be loaded"
              action={
                <Button size="sm" variant="secondary" onClick={() => void load(queryString)}>
                  Try again
                </Button>
              }
            >
              {error}
            </Notice>
          ) : null}

          {activeChips.length > 0 ? (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Filtered by</span>
              {activeChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onClear}
                  aria-label={`Remove filter ${chip.label}`}
                  className="flex items-center gap-1.5 border border-line bg-paper px-2.5 py-1 text-[12px] text-ink hover:border-ink hover:bg-shell"
                >
                  {chip.label}
                  <span aria-hidden className="text-slate">
                    ×
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4" aria-hidden>
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-5 border-b border-line py-4">
                  <Skeleton className="h-4 w-9" />
                  <Skeleton className="h-16 w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && sortedEvents.length === 0 ? (
            <EmptyState
              title={
                filters.query.trim()
                  ? `No events match “${filters.query.trim()}”`
                  : 'No events match those filters'
              }
              description={
                activeChips.length > 1
                  ? `Applied together: ${activeChips
                      .map((chip) => chip.label)
                      .join(' plus ')}. Every filter has to match at once — remove one to widen the search.`
                  : activeChips.length === 1
                    ? `Nothing on sale matches ${activeChips[0].label} right now. Try another term, or clear the filter to see everything.`
                    : 'There are no events on sale yet. Try again shortly.'
              }
              action={
                activeFilters > 0 ? (
                  <Button variant="secondary" onClick={clearAll}>
                    Clear all filters
                  </Button>
                ) : null
              }
            />
          ) : null}

          {!loading && !error
            ? groups.map((group) => (
                <section key={group.key} className="mb-8">
                  <div className="flex items-baseline justify-between border-b border-line pb-2.5">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                      {group.weekday} {group.label}
                      <span className="ml-2 font-normal normal-case tracking-normal text-slate">
                        {formatNumber(group.events.length)} {group.events.length === 1 ? 'event' : 'events'}
                      </span>
                    </h2>
                  </div>
                  {group.events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </section>
              ))
            : null}
        </div>
      </div>
    </div>
  )
}
