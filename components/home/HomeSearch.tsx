'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { rangeFor, WHEN_OPTIONS, WhenOption } from '@/lib/date-range'

interface HomeSearchProps {
  initialQuery?: string
}

export function HomeSearch({ initialQuery = '' }: HomeSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [when, setWhen] = useState<WhenOption>('any')
  const [where, setWhere] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    if (where.trim()) params.set('location', where.trim())
    const { minDate, maxDate } = rangeFor(when)
    if (minDate) params.set('minDate', minDate)
    if (maxDate) params.set('maxDate', maxDate)
    router.push(params.toString() ? `/events?${params.toString()}` : '/events')
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="mt-9 flex flex-col border border-line bg-paper sm:flex-row sm:items-stretch"
    >
      <div className="min-w-0 flex-1 border-b border-line px-4 py-3 sm:border-b-0">
        <label
          htmlFor="home-query"
          className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate"
        >
          Event or venue
        </label>
        <input
          id="home-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-slate-faint"
          placeholder="Nyimbo Live Sessions"
        />
      </div>

      <div className="border-line px-4 py-3 sm:w-[136px] sm:shrink-0 sm:border-l">
        <label
          htmlFor="home-when"
          className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate"
        >
          When
        </label>
        <select
          id="home-when"
          value={when}
          onChange={(event) => setWhen(event.target.value as WhenOption)}
          className="mt-1 w-full bg-transparent text-sm outline-none"
        >
          {WHEN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-line px-4 py-3 sm:w-[148px] sm:shrink-0 sm:border-l sm:border-t-0">
        <label
          htmlFor="home-where"
          className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate"
        >
          Where
        </label>
        <input
          id="home-where"
          value={where}
          onChange={(event) => setWhere(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-slate-faint"
          placeholder="Venue or area"
        />
      </div>

      <div className="p-2">
        <Button type="submit" size="md" className="w-full whitespace-nowrap sm:w-auto">
          Find events
        </Button>
      </div>
    </form>
  )
}
