/**
 * One status vocabulary for the whole product.
 * The wallet, the event page, the scanner and every dashboard table use the
 * same words and colours, so a status never means two different things.
 */

export type StatusTone = 'neutral' | 'positive' | 'pending' | 'danger'

export interface StatusMeta {
  label: string
  tone: StatusTone
}

const UNKNOWN: StatusMeta = { label: 'Unknown', tone: 'neutral' }

const TICKET_STATUS = {
  PENDING: { label: 'Awaiting payment', tone: 'pending' },
  CONFIRMED: { label: 'Confirmed', tone: 'positive' },
  CHECKED_IN: { label: 'Admitted', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
} satisfies Record<string, StatusMeta>

const EVENT_STATUS = {
  DRAFT: { label: 'Draft', tone: 'pending' },
  PUBLISHED: { label: 'On sale', tone: 'positive' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  COMPLETED: { label: 'Finished', tone: 'neutral' },
} satisfies Record<string, StatusMeta>

const PAYMENT_STATUS = {
  PENDING: { label: 'Awaiting payment', tone: 'pending' },
  PROCESSING: { label: 'Processing', tone: 'pending' },
  SUCCESS: { label: 'Paid', tone: 'positive' },
  SUCCEEDED: { label: 'Paid', tone: 'positive' },
  FAILED: { label: 'Failed', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
} satisfies Record<string, StatusMeta>

const PAYOUT_STATUS = {
  PENDING: { label: 'Pending', tone: 'pending' },
  PROCESSING: { label: 'Processing', tone: 'pending' },
  COMPLETED: { label: 'Paid out', tone: 'positive' },
  FAILED: { label: 'Failed', tone: 'danger' },
} satisfies Record<string, StatusMeta>

function resolve(map: Record<string, StatusMeta>, value?: string | null): StatusMeta {
  if (!value) return UNKNOWN
  return map[value.toUpperCase()] ?? { label: prettify(value), tone: 'neutral' }
}

function prettify(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export const ticketStatus = (value?: string | null) => resolve(TICKET_STATUS, value)
export const eventStatus = (value?: string | null) => resolve(EVENT_STATUS, value)
export const paymentStatus = (value?: string | null) => resolve(PAYMENT_STATUS, value)
export const payoutStatus = (value?: string | null) => resolve(PAYOUT_STATUS, value)

export const ROLE_LABELS: Record<string, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Organizer',
  EVENT_OWNER: 'Organizer',
  ADMIN: 'Administrator',
  SCANNER: 'Door staff',
  PENDING_ORGANIZER: 'Organizer application pending',
}

export function roleLabel(role?: string | null): string {
  if (!role) return 'Guest'
  return ROLE_LABELS[role] ?? prettify(role)
}

/** Roles that may open the organizer workspace. */
export function canOrganise(role?: string | null): boolean {
  return role === 'ORGANIZER' || role === 'EVENT_OWNER' || role === 'ADMIN'
}

export function isAdmin(role?: string | null): boolean {
  return role === 'ADMIN'
}

/** Tones map to the one colour that means that thing in this product. */
export const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-slate-light',
  positive: 'bg-forest',
  pending: 'bg-ochre',
  danger: 'bg-crimson',
}
