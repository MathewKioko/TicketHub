/** Shared view models — safe to import from client components. */

export interface EventSummary {
  id: string
  title: string
  description?: string
  date: string
  endTime?: string | null
  venue: string
  category: string
  imageUrl: string | null
  basePrice: number
  currency: string
  status: string
  organizerId?: string
  organizerName: string
  /** Confirmed + checked-in tickets. Pending carts never count as sold. */
  sold: number
  capacity: number
}

export interface TicketView {
  id: string
  status: string
  price: number
  userId: string
  qrCode?: string
  qrCodeData?: string
  createdAt?: string
  checkedInAt?: string | null
  event: {
    id: string
    title: string
    date: string
    venue: string
    imageUrl?: string | null
  }
  user?: {
    name: string
    email: string
  }
}
