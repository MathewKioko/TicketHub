'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/cn'
import { isActive, isFocusedRoute } from '@/lib/site'
import { canOrganise, isAdmin } from '@/lib/status'

export function SiteHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { toggleTheme, resolvedTheme } = useTheme()
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
            <Link href="/" aria-label="TicketHub home" className="flex items-center gap-3">
              <Image
                src="/LOGO.png"
                alt="TicketHub"
                width={64}
                height={64}
                className="h-[64px] w-[64px] object-contain"
              />
              <span className="text-[22px] font-bold tracking-[0.17em]">TICKETHUB</span>
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
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center gap-2 text-[12px] font-medium"
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
