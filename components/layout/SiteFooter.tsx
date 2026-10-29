'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { canOrganise, isAdmin } from '@/lib/status'
import { isFocusedRoute } from '@/lib/site'

export function SiteFooter() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (isFocusedRoute(pathname)) return null

  return (
    <footer className="mt-16 border-t border-line bg-bone print-hide">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-10 border-b border-line pb-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="block h-[10px] w-[10px] bg-flame" />
              <span className="text-[15px] font-semibold tracking-[0.17em]">TICKETHUB</span>
            </div>
            <p className="mt-4 max-w-[30ch] text-[13px] leading-relaxed text-slate">
              Ticketing for Kenyan events. Built in Nairobi.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.13em]">Discover</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate">
              <li>
                <Link href="/events" className="hover:text-ink">
                  All events
                </Link>
              </li>
              <li>
                <Link href="/events?when=weekend" className="hover:text-ink">
                  This weekend
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-ink">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.13em]">Organizers</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate">
              <li>
                <Link href="/become-organizer" className="hover:text-ink">
                  Sell tickets
                </Link>
              </li>
              {canOrganise(user?.role) ? (
                <>
                  <li>
                    <Link href="/events/create" className="hover:text-ink">
                      Create an event
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/organizer" className="hover:text-ink">
                      Event workspace
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/organizer/settings" className="hover:text-ink">
                      Payout settings
                    </Link>
                  </li>
                </>
              ) : null}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.13em]">Account</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate">
              <li>
                <Link href="/dashboard/attendee" className="hover:text-ink">
                  My tickets
                </Link>
              </li>
              {user ? (
                <li>
                  <Link href="/dashboard/attendee" className="hover:text-ink">
                    Order history
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/auth/login" className="hover:text-ink">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="hover:text-ink">
                      Create an account
                    </Link>
                  </li>
                </>
              )}
              {isAdmin(user?.role) ? (
                <li>
                  <Link href="/dashboard/admin" className="hover:text-ink">
                    Admin console
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-slate">
          <span>© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</span>
          <span>Payments in KES by Paystack and M-Pesa</span>
        </div>
      </div>
    </footer>
  )
}
