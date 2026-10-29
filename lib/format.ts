import { format, isSameDay } from 'date-fns'

/** Nairobi is UTC+3 year-round; the API stores UTC timestamps. */
export const TIME_ZONE_LABEL = 'EAT'

/** Coerces API date strings / Date objects into a valid Date, or null. */
export function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  // ISO 8601 strings (what the API returns) parse natively.
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatMoney(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return `KES ${Math.round(value).toLocaleString('en-US')}`
}

/** Compact figure for dashboard tiles: KES 3.2m */
export function formatMoneyShort(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  if (Math.abs(value) >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}m`
  if (Math.abs(value) >= 10_000) return `KES ${Math.round(value / 1000)}k`
  return `KES ${Math.round(value).toLocaleString('en-US')}`
}

export function formatNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0'
  return value.toLocaleString('en-US')
}

/** "Sat 8 Nov" */
export function formatEventDate(value: string | Date | null | undefined): string {
  const date = asDate(value)
  return date ? format(date, 'EEE d MMM') : 'Date to be confirmed'
}

/** "Sat 8 Nov 2026" */
export function formatFullDate(value: string | Date | null | undefined): string {
  const date = asDate(value)
  return date ? format(date, 'EEE d MMM yyyy') : 'Date to be confirmed'
}

/** "19:00 EAT" */
export function formatTime(value: string | Date | null | undefined): string {
  const date = asDate(value)
  return date ? `${format(date, 'HH:mm')} ${TIME_ZONE_LABEL}` : ''
}

/** "Sat 8 Nov · 19:00 EAT" */
export function formatEventStamp(value: string | Date | null | undefined): string {
  const date = asDate(value)
  return date ? `${format(date, 'EEE d MMM')} · ${format(date, 'HH:mm')} ${TIME_ZONE_LABEL}` : 'Date to be confirmed'
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = asDate(value)
  return date ? format(date, 'd MMM yyyy, HH:mm') : '—'
}

export function isPast(value: string | Date | null | undefined): boolean {
  const date = asDate(value)
  return date ? date.getTime() < Date.now() : false
}

export function isToday(value: string | Date | null | undefined): boolean {
  const date = asDate(value)
  return date ? isSameDay(date, new Date()) : false
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * Deterministic lead event: the soonest upcoming one by date.
 * We deliberately do not claim curation or popularity.
 */
export function pickNextUpcoming<T extends { date: string | Date }>(events: T[]): T | null {
  const now = Date.now()
  const withTimes = events
    .map((event) => ({ event, time: asDate(event.date)?.getTime() ?? 0 }))
    .filter((entry) => entry.time > now)
    .sort((a, b) => a.time - b.time)
  return withTimes.length > 0 ? withTimes[0].event : null
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'TH'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
  return letters || 'TH'
}
