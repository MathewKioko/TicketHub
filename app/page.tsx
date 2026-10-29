import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import { EventRow } from '@/components/events/EventRow'
import { HomeSearch } from '@/components/home/HomeSearch'
import { getPublishedEvents, EventSummary } from '@/lib/events-data'
import { asDate, formatMoney, formatNumber, pickNextUpcoming } from '@/lib/format'
import { EVENT_CATEGORIES } from '@/lib/site'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events in Nairobi',
  description:
    'Concerts, theatre, comedy and conferences across Kenya. Compare prices and availability, then pay with M-Pesa or card.',
  alternates: { canonical: '/' },
}

interface DateGroup {
  key: string
  /** "8 Nov" */
  label: string
  /** "Saturday" */
  weekday: string
  events: EventSummary[]
}

function groupByDate(events: EventSummary[]): DateGroup[] {
  const groups = new Map<string, DateGroup>()

  for (const event of events) {
    const date = asDate(event.date)
    if (!date) continue
    const key = date.toISOString().slice(0, 10)
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, { key, label: format(date, 'd MMM'), weekday: format(date, 'EEEE'), events: [event] })
    }
  }

  return Array.from(groups.values())
}



export default async function HomePage() {
  const allEvents = await getPublishedEvents(48)
  const now = Date.now()
  const upcoming = allEvents.filter((event) => {
    const date = asDate(event.date)
    return date ? date.getTime() >= now : false
  })

  const lead = pickNextUpcoming(upcoming)
  const rest = upcoming.filter((event) => event.id !== lead?.id)
  const groups = groupByDate(rest)

  const confirmedTickets = upcoming.reduce((total, event) => total + event.sold, 0)

  return (
    <div className="bg-bone">
      {/* ── hero ─────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_46%]">
          <div className="px-5 pb-12 pt-12 sm:px-8 lg:flex lg:h-full lg:flex-col lg:pl-[max(32px,calc((100vw-1400px)/2+32px))] lg:pr-16 lg:pt-14">
            <h1 className="display text-[50px] leading-[0.98] sm:text-[62px] lg:text-[68px]">
              What&rsquo;s on
              <br />
              in <span className="italic">Nairobi.</span>
            </h1>

            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-slate">
              Concerts, theatre and conferences across Kenya. Pay with M-Pesa or card, and your
              ticket lands in your wallet the moment payment clears.
            </p>

            <HomeSearch />

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <Link href="/events?when=today" className="font-medium text-ink underline decoration-flame decoration-[1.5px] underline-offset-[6px]">
                Today
              </Link>
              <Link href="/events?when=weekend" className="text-slate hover:text-ink">
                This weekend
              </Link>
              <Link href="/events?when=week" className="text-slate hover:text-ink">
                Next 7 days
              </Link>
              <Link href="/events" className="text-slate hover:text-ink">
                All events
              </Link>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[13px] text-slate">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">Browse by</span>
              {EVENT_CATEGORIES.slice(0, 6).map((category) => (
                <Link
                  key={category}
                  href={`/events?category=${encodeURIComponent(category)}`}
                  className="hover:text-ink"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {/* lead event: the soonest upcoming event, stated plainly */}
          <div className="border-t border-line lg:border-l lg:border-t-0">
            {lead ? (
              <>
                <div className="h-[300px] w-full overflow-hidden bg-shell sm:h-[360px] lg:h-[468px]">
                  {lead.imageUrl ? (
                    <img
                      src={lead.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-[0.14em] text-slate-light">
                      {lead.category}
                    </div>
                  )}
                </div>
                <div className="border-t border-line px-5 py-5 sm:px-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-slate">
                        {asDate(lead.date) ? format(asDate(lead.date) as Date, 'EEE d MMM') : 'Soon'} ·{' '}
                        {formatMoney(lead.basePrice)} entry
                      </p>
                      <h2 className="display mt-1.5 truncate text-[28px] leading-tight">{lead.title}</h2>
                      <p className="mt-1.5 truncate text-[13px] text-slate">
                        {lead.venue} · {lead.organizerName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate">From</p>
                      <p className="tnum text-[15px] font-medium">{formatMoney(lead.basePrice)}</p>
                      <Link
                        href={`/events/${lead.id}`}
                        className="mt-3 inline-block border-b border-ink pb-0.5 text-[13px] font-medium hover:border-flame hover:text-flame"
                      >
                        View event
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-start justify-center gap-4 px-5 py-12 sm:px-8">
                <p className="display text-[26px] leading-tight">Nothing on sale just yet.</p>
                <p className="max-w-[34ch] text-sm text-slate">
                  Events appear here as soon as an organizer publishes them. Check the full list or
                  apply to sell tickets yourself.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/events" className="border border-ink px-4 py-2.5 text-[13px] font-medium hover:bg-ink hover:text-bone">
                    Browse events
                  </Link>
                  <Link href="/become-organizer" className="px-4 py-2.5 text-[13px] font-medium text-slate hover:text-ink">
                    Sell tickets
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── programme ────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-4">
          <div>
            <h2 className="display text-[34px] leading-none">The programme</h2>
            <p className="mt-2 text-[13px] text-slate">
              Listed by date, soonest first. {upcoming.length > 0 ? `${upcoming.length} events on sale.` : 'No events on sale yet.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[13px]">
            <Link href="/events" className="bg-shell px-3 py-1.5 font-medium">
              By date
            </Link>
            <Link href="/events" className="px-3 py-1.5 text-slate hover:text-ink">
              By category
            </Link>
            <Link href="/events?sort=price" className="px-3 py-1.5 text-slate hover:text-ink">
              Lowest price
            </Link>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="mt-8 border border-line bg-paper px-6 py-12 text-center">
            <p className="display text-[22px]">No other events listed this week.</p>
            <p className="mx-auto mt-2 max-w-[46ch] text-sm text-slate">
              {lead ? 'The event above is the only one scheduled right now.' : 'Browse the full list to see everything on sale.'}
            </p>
            <Link href="/events" className="mt-5 inline-block border border-ink px-5 py-2.5 text-[13px] font-medium hover:bg-ink hover:text-bone">
              Open the full programme
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[120px_1fr] lg:gap-8">
              <div className="lg:pt-4">
                <p className="display text-[26px] leading-none">{group.label}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                  {group.weekday}
                </p>
              </div>
              <div>
                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))
        )}

        {groups.length > 0 ? (
          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <p className="tnum text-[13px] text-slate">
              Showing {formatNumber(Math.min(upcoming.length, 48))} of {formatNumber(upcoming.length)} events in Nairobi
            </p>
            <Link href="/events" className="text-[13px] font-medium underline decoration-line underline-offset-[6px] hover:decoration-flame">
              Open the full programme →
            </Link>
          </div>
        ) : null}
      </section>

      {/* ── organizer band ───────────────────────────────────── */}
      <section className="bg-ink text-bone">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:py-20">
          <div>
            <h2 className="display max-w-[15ch] text-[38px] leading-[1.05] lg:text-[46px]">
              Run the door, not a spreadsheet.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#C9C2B6]">
              Publish an event, watch tickets sell as they happen, scan guests in on arrival, and see
              what each event has earned — in one workspace, in shillings.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link href="/become-organizer" className="bg-bone px-5 py-3 text-[13px] font-medium text-ink hover:bg-white">
                Apply to sell tickets
              </Link>
              <Link
                href="/become-organizer"
                className="text-[13px] text-[#C9C2B6] underline decoration-[#5B5346] decoration-[1.5px] underline-offset-[6px] hover:text-bone"
              >
                How organizer accounts work
              </Link>
            </div>
            <p className="mt-7 text-[12px] text-[#8F8778]">
              Organizer accounts are reviewed before publishing. Payouts settle through Paystack to
              your bank account.
            </p>
          </div>

          <div className="border border-[#2E2820]">
            <div className="border-b border-[#2E2820] px-5 py-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.13em] text-[#8F8778]">
                On the platform right now
              </p>
            </div>
            <dl className="divide-y divide-[#2E2820]">
              <div className="flex items-baseline justify-between px-5 py-4">
                <dt className="text-[13px] text-[#C9C2B6]">Events on sale</dt>
                <dd className="tnum text-[15px]">{formatNumber(upcoming.length)}</dd>
              </div>
              <div className="flex items-baseline justify-between px-5 py-4">
                <dt className="text-[13px] text-[#C9C2B6]">Confirmed tickets</dt>
                <dd className="tnum text-[15px]">{formatNumber(confirmedTickets)}</dd>
              </div>
              <div className="flex items-baseline justify-between px-5 py-4">
                <dt className="text-[13px] text-[#C9C2B6]">What an organizer sees</dt>
                <dd className="max-w-[22ch] text-right text-[12px] leading-relaxed text-[#8F8778]">
                  Sold, checked in, gross and payout per event
                </dd>
              </div>
            </dl>
            <p className="border-t border-[#2E2820] px-5 py-3 text-[11px] text-[#8F8778]">
              Figures cover events currently listed on TicketHub.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
