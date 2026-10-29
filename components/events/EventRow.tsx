import Link from 'next/link'
import type { EventSummary } from '@/lib/types'
import { formatMoney, formatNumber, formatTime } from '@/lib/format'

interface EventRowProps {
  event: EventSummary
  /** Hide the thumbnail in dense dashboard-style lists. */
  compact?: boolean
}

export function EventRow({ event, compact = false }: EventRowProps) {
  const soldOut = event.capacity > 0 && event.sold >= event.capacity
  const isFree = event.basePrice <= 0
  const time = formatTime(event.date).replace(' EAT', '')

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex items-center gap-4 border-b border-line py-4 transition-colors hover:bg-shell/60 sm:gap-5"
    >
      <div className="tnum w-9 shrink-0 text-[13px] text-slate">{time}</div>

      {compact ? null : (
        <div className="h-16 w-24 shrink-0 overflow-hidden bg-shell">
          {event.imageUrl ? (
            // Organizer-supplied artwork can live on any host, so it stays a
            // plain <img> instead of an optimiser that would reject unknown domains.
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.12em] text-slate-light">
              No image
            </span>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="display text-[21px] leading-tight">{event.title}</p>
        <p className="mt-1 truncate text-[13px] text-slate">
          {event.venue} · {event.category}
        </p>
        <p className="tnum mt-1 text-[12px] text-slate sm:hidden">
          {soldOut ? 'Sold out' : isFree ? 'Free' : formatMoney(event.basePrice)}
          {event.capacity > 0 ? ` · ${formatNumber(event.sold)} of ${formatNumber(event.capacity)} sold` : ''}
        </p>
      </div>

      <div className="hidden w-[132px] shrink-0 text-right sm:block">
        {soldOut ? (
          <p className="text-[13px] font-medium text-ochre">Sold out</p>
        ) : (
          <p className="tnum text-[13px] font-medium">{isFree ? 'Free' : formatMoney(event.basePrice)}</p>
        )}
        <p className="tnum mt-0.5 text-[12px] text-slate">
          {event.capacity > 0
            ? `${formatNumber(event.sold)} of ${formatNumber(event.capacity)} sold`
            : `${formatNumber(event.sold)} sold`}
        </p>
      </div>

      <div
        aria-hidden
        className="w-4 shrink-0 text-right text-[15px] text-slate transition-transform group-hover:translate-x-1 group-hover:text-flame"
      >
        →
      </div>
    </Link>
  )
}
