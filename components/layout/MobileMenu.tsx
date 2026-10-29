'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { canOrganise, isAdmin } from '@/lib/status'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth()
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const linkClass = 'block border-b border-line py-3.5 text-[15px]'

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute inset-y-0 right-0 flex w-[86%] max-w-[340px] animate-fade-in flex-col border-l border-line bg-bone px-5 py-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[0.16em]">MENU</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="px-1 py-1 text-[13px] text-slate hover:text-ink"
          >
            Close
          </button>
        </div>

        <nav className="mt-5 flex-1" aria-label="Mobile">
          <Link href="/events" onClick={onClose} className={linkClass}>
            Browse events
          </Link>
          <Link href="/dashboard/attendee" onClick={onClose} className={linkClass}>
            My tickets
          </Link>
          {canOrganise(user?.role) ? (
            <Link href="/dashboard/organizer" onClick={onClose} className={linkClass}>
              Organizer workspace
            </Link>
          ) : null}
          {isAdmin(user?.role) ? (
            <Link href="/dashboard/admin" onClick={onClose} className={linkClass}>
              Admin console
            </Link>
          ) : null}
          {!user ? (
            <Link href="/become-organizer" onClick={onClose} className={linkClass}>
              Sell tickets
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-line pt-4">
          {user ? (
            <>
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate">{user.email}</p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  void logout()
                }}
                className="mt-4 w-full border border-line py-2.5 text-[13px] font-medium text-crimson"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={onClose}
                className="border border-line py-2.5 text-center text-[13px] font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="bg-ink py-2.5 text-center text-[13px] font-medium text-bone"
              >
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
