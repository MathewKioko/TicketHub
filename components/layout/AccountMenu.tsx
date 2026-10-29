'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { canOrganise, isAdmin, roleLabel } from '@/lib/status'
import { initials } from '@/lib/format'

/**
 * Click-open (not hover-only) so it works with a keyboard and on touch.
 */
export function AccountMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-sm text-[13px] hover:text-flame"
      >
        <span className="flex h-8 w-8 items-center justify-center bg-ink text-[11px] font-medium tracking-wide text-bone">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-[120px] truncate text-ink sm:block">{user.name.split(' ')[0]}</span>
        <span aria-hidden className="text-[10px] text-slate">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[248px] animate-fade-in border border-line bg-paper shadow-overlay"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate">{user.email}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate">{roleLabel(user.role)}</p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard/attendee"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] hover:bg-shell"
            >
              My tickets
            </Link>
            {canOrganise(user.role) ? (
              <Link
                href="/dashboard/organizer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[13px] hover:bg-shell"
              >
                Organizer workspace
              </Link>
            ) : null}
            {isAdmin(user.role) ? (
              <Link
                href="/dashboard/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-[13px] hover:bg-shell"
              >
                Admin console
              </Link>
            ) : null}
          </div>

          <div className="border-t border-line py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void logout()
              }}
              className="block w-full px-4 py-2 text-left text-[13px] text-crimson hover:bg-shell"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
