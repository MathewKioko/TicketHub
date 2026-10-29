'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Role =
  | 'ATTENDEE'
  | 'PENDING_ORGANIZER'
  | 'ORGANIZER'
  | 'EVENT_OWNER'
  | 'ADMIN'
  | 'SCANNER'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role | string
  verified: boolean
  phone?: string | null
}

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  refresh: () => Promise<SessionUser | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Older pages keyed off this; login still mirrors it so nothing silently breaks. */
const LEGACY_USER_KEY = 'TicketHub_userId'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!response.ok) {
        setUser(null)
        return null
      }
      const data = (await response.json()) as { user?: SessionUser }
      const nextUser = data.user ?? null
      setUser(nextUser)
      if (nextUser?.id && typeof window !== 'undefined') {
        window.localStorage.setItem(LEGACY_USER_KEY, nextUser.id)
      }
      return nextUser
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Signing out locally is still correct if the request fails.
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_USER_KEY)
      window.localStorage.removeItem('Ticket Hub_userId')
    }
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
