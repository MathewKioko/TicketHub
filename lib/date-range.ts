export type WhenOption = 'any' | 'today' | 'weekend' | 'week'

export const WHEN_OPTIONS: { value: WhenOption; label: string }[] = [
  { value: 'any', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'Next 7 days' },
]

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

/** Maps a human date choice onto the minDate/maxDate the events API accepts. */
export function rangeFor(when: WhenOption): { minDate?: string; maxDate?: string } {
  const now = new Date()

  if (when === 'today') {
    return { minDate: startOfDay(now).toISOString(), maxDate: endOfDay(now).toISOString() }
  }

  if (when === 'week') {
    const end = new Date(now)
    end.setDate(end.getDate() + 7)
    return { minDate: now.toISOString(), maxDate: endOfDay(end).toISOString() }
  }

  if (when === 'weekend') {
    const day = now.getDay()
    const saturday = new Date(now)
    saturday.setDate(now.getDate() + ((6 - day + 7) % 7))
    const sunday = new Date(saturday)
    sunday.setDate(saturday.getDate() + 1)
    const start = day === 0 || day === 6 ? now : saturday
    const end = day === 0 ? now : sunday
    return { minDate: startOfDay(start).toISOString(), maxDate: endOfDay(end).toISOString() }
  }

  return {}
}

/** Turns a `when` query value into the date bounds, ignoring unknown values. */
export function rangeForParam(when: string | null): { minDate?: string; maxDate?: string } {
  if (!when) return {}
  const match = WHEN_OPTIONS.find((option) => option.value === when)
  return match ? rangeFor(match.value) : {}
}
