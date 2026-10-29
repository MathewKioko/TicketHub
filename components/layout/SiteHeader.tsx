'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/cn'
import { isActive, isFocusedRoute } from '@/lib/site'
import { canOrganise, isAdmin } from '@/lib/status'

export function SiteHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (isFocusedRoute(pathname)) return null

  const navItems = [
    { label: 'Browse events', href: '/events' },
    { label: 'My tickets', href: '/dashboard/attendee' },
    ...(canOrganise(user?.role) ? [{ label: 'Organizer', href: '/dashboard/organizer' }] : []),
    ...(isAdmin(user?.role) ? [{ label: 'Admin', href: '/dashboard/admin' }] : []),
  ]

  return (
    <>
      <header className="border-b border-line bg-bone print-hide">
        <div className="mx-auto flex h-[66px] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" aria-label="TicketHub home" className="flex items-center gap-2.5">
              <span aria-hidden className="block h-[10px] w-[10px] bg-flame" />
              <span className="text-[15px] font-semibold tracking-[0.17em]">TICKETHUB</span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-7 text-[13px] md:flex">
              {navItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'transition-colors hover:text-ink',
                    isActive(pathname, link.href)
                      ? 'font-medium text-ink underline decoration-flame decoration-[1.5px] underline-offset-[7px]'
                      : 'text-slate'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <AccountMenu />
            ) : (
              // While the session is checked, show the signed-out actions
              // rather than an empty placeholder that reads as broken chrome.
              <div className={cn('flex items-center gap-4 sm:gap-6', loading && 'opacity-70')}>
                <Link
                  href="/auth/login"
                  className="hidden text-[13px] font-medium text-ink hover:text-flame sm:block"
                >
                  Sign in
                </Link>
                <Link
                  href="/become-organizer"
                  className="bg-ink px-4 py-2.5 text-[13px] font-medium text-bone hover:bg-ink-soft"
                >
                  Sell tickets
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 text-[12px] font-medium md:hidden"
            >
              Menu
              <span aria-hidden className="flex w-[18px] flex-col gap-[3px]">
                <span className="block h-[1.5px] w-full bg-ink" />
                <span className="block h-[1.5px] w-full bg-ink" />
                <span className="block h-[1.5px] w-full bg-ink" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}


