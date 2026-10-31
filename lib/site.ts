export interface NavLink {
  label: string
  href: string
}

export const EVENT_CATEGORIES = [
  'Music',
  'Theatre',
  'Comedy',
  'Business',
  'Culture',
  'Sport',
  'Workshop',
  'Other',
] as const

export const ORGANIZER_TABS: NavLink[] = [
  { label: 'Events', href: '/dashboard/organizer' },
  { label: 'Create event', href: '/events/create' },
  { label: 'Scanner', href: '/scanner' },
  { label: 'Payout settings', href: '/dashboard/organizer/settings' },
]

export const ADMIN_TABS: NavLink[] = [
  { label: 'Overview', href: '/dashboard/admin' },
  { label: 'Users', href: '/dashboard/admin/users' },
  { label: 'Payouts', href: '/dashboard/admin/payouts' },
  { label: 'Bank verification', href: '/dashboard/admin/bank-verification' },
  { label: 'Settings', href: '/dashboard/admin/settings' },
  { label: 'Admin Roles', href: '/dashboard/admin/roles' },
  { label: 'Audit Log', href: '/dashboard/admin/audit' },
  { label: 'Events', href: '/dashboard/admin/events' },
]

/**
 * Flows that should not render the global chrome: they own the whole
 * viewport and offer a single, explicit way out.
 */
const FOCUSED_PREFIXES = ['/checkout', '/auth', '/tickets', '/scanner']

export function isFocusedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return FOCUSED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/events') return pathname === '/events' || pathname.startsWith('/events/')
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Returns the single most specific href that matches the current path, so a
 * section tab bar never lights up both "Overview" and "Users" at once.
 */
export function activeHref(pathname: string | null, hrefs: string[]): string | null {
  if (!pathname) return null
  const matches = hrefs.filter((href) => isActive(pathname, href))
  if (matches.length === 0) return null
  return matches.reduce((longest, href) => (href.length > longest.length ? href : longest))
}
