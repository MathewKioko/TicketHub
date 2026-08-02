'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Ticket, QrCode, Download, Copy, Check, CalendarPlus, ArrowRight, Scissors } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { downloadTicketReceipt } from '@/lib/ticket-receipt'
import { downloadCalendarFile } from '@/lib/calendar'

interface Ticket {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN'
  price: number
  quantity: number
  qrCodeImage?: string
  qrCodeData?: string
  checkedInAt?: string
  event: {
    id: string
    title: string
    date: string
    endDate?: string
    venue: string
    imageUrl?: string
  }
  user?: {
    name: string
    email: string
  }
}

export default function AttendeeDashboard() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('TicketHub_userId')
    if (!userId) {
      router.push('/auth/login')
      return
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.name) {
          setUserName(data.user.name)
        }
      })
      .catch(console.error)

    fetchTickets()
    verifyPendingPayments()
  }, [router])

  const verifyPendingPayments = async () => {
    try {
      const res = await fetch('/api/tickets/verify-all-pending', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.updated > 0) {
        setTimeout(() => fetchTickets(), 1000)
      }
    } catch (error) {
      console.error('Error verifying payments:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      const userId = localStorage.getItem('TicketHub_userId')
      if (!userId) {
        router.push('/auth/login')
        return
      }

      const url = `/api/tickets/my?userId=${userId}`

      const res = await fetch(url)
      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setTickets(data.tickets || [])
      } else {
        toast.error(data.error || 'Failed to load tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = async (ticket: Ticket) => {
    if (!ticket.qrCodeImage) {
      toast.error('QR code not available')
      return
    }

    try {
      await downloadTicketReceipt({
        id: ticket.id,
        event: ticket.event,
        user: ticket.user || {
          name: 'User',
          email: 'user@example.com',
        },
        price: ticket.price,
        quantity: ticket.quantity,
        status: ticket.status,
        qrCodeImage: ticket.qrCodeImage,
        qrCodeData: ticket.qrCodeData,
      })
      toast.success('Ticket receipt downloaded!')
    } catch (error) {
      console.error('Error downloading ticket:', error)
      toast.error('Failed to download ticket receipt')
    }
  }

  const copyQRCodeData = async (ticket: Ticket) => {
    if (!ticket.qrCodeData) return

    try {
      await navigator.clipboard.writeText(ticket.qrCodeData)
      setCopiedId(ticket.id)
      toast.success('QR code data copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Failed to copy QR code data')
    }
  }

  const addToCalendar = (ticket: Ticket) => {
    try {
      const eventDate = new Date(ticket.event.date)
      const endDate = ticket.event.endDate
        ? new Date(ticket.event.endDate)
        : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)

      downloadCalendarFile({
        title: ticket.event.title,
        description: `Event: ${ticket.event.title}\n\nYou have ${ticket.quantity} ticket${ticket.quantity !== 1 ? 's' : ''} for this event.\n\nPrice: KES ${ticket.price.toLocaleString()}\n\nDon't forget to bring your ticket QR code!`,
        location: ticket.event.venue,
        startDate: eventDate,
        endDate: endDate,
        organizer: ticket.user ? {
          name: ticket.user.name,
          email: ticket.user.email,
        } : undefined,
      }, `event-${ticket.event.title.replace(/[^a-z0-9]/gi, '_')}.ics`)

      toast.success('Calendar event downloaded!')
    } catch (error) {
      console.error('Error adding to calendar:', error)
      toast.error('Failed to generate calendar file')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading your passes...</p>
        </div>
      </div>
    )
  }

  const upcomingTickets = tickets.filter(
    t => t.status === 'CONFIRMED' && new Date(t.event.date) > new Date()
  )
  const pastTickets = tickets.filter(
    t => new Date(t.event.date) < new Date() || t.status === 'CHECKED_IN'
  )

  return (
    <div className="min-h-screen bg-luxe">
      {/* Header */}
      <div className="glass-dark border-b border-gold/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="animate-fade-in-up">
              {userName && (
                <p className="text-gold font-medium mb-2">Welcome back, {userName}</p>
              )}
              <div className="flex items-center gap-4 mb-2">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 bg-gold/20 rounded-2xl blur-sm" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="TicketHub"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-ivory">
                  My <span className="gradient-text italic">Wallet</span>
                </h1>
              </div>
              <p className="text-taupe">Your passes, all in one place</p>
            </div>
            <Link href="/events">
              <Button variant="gold" size="lg" className="animate-scale-in">
                Explore Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Upcoming Events — Ticket Stub Cards */}
        {upcomingTickets.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ivory mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-gold" />
              Upcoming Events
            </h2>
            <div className="space-y-6">
              {upcomingTickets.map((ticket, index) => (
                <TicketStub key={ticket.id} ticket={ticket} index={index} copiedId={copiedId} onCopy={copyQRCodeData} onDownload={downloadTicket} onCalendar={addToCalendar} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastTickets.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ivory mb-5 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-gold" />
              Past Events
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTickets.map(ticket => (
                <div key={ticket.id} className="luxe-card rounded-xl overflow-hidden opacity-70 hover:opacity-100 transition-all">
                  {ticket.event.imageUrl && (
                    <img
                      src={ticket.event.imageUrl}
                      alt={ticket.event.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="px-5 py-5">
                    <h3 className="font-display text-lg font-semibold mb-2 text-ivory line-clamp-1">{ticket.event.title}</h3>
                    <div className="space-y-2 text-sm text-taupe mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(ticket.event.date), 'MMM dd, yyyy')}
                      </div>
                      {ticket.checkedInAt && (
                        <div className="flex items-center gap-2 text-gold">
                          <QrCode className="w-4 h-4" />
                          Attended
                        </div>
                      )}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'CHECKED_IN'
                        ? 'bg-gold/15 text-gold-light border border-gold/20'
                        : 'bg-white/5 text-taupe border border-white/10'
                    }`}>
                      {ticket.status === 'CHECKED_IN' ? 'Attended' : 'Past Event'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tickets.length === 0 && (
          <div className="glass-luxe rounded-2xl p-14 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Ticket className="w-10 h-10 text-gold" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ivory mb-2">No tickets yet</h3>
            <p className="text-taupe mb-8">Explore the collection and reserve your first experience.</p>
            <Link href="/events">
              <Button variant="gold">
                Explore Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Horizontal Ticket Stub Card with perforated divider — clickable to view full ticket
function TicketStub({ ticket, index, copiedId, onCopy, onDownload, onCalendar }: {
  ticket: Ticket
  index: number
  copiedId: string | null
  onCopy: (ticket: Ticket) => void
  onDownload: (ticket: Ticket) => void
  onCalendar: (ticket: Ticket) => void
}) {
  const router = useRouter()
  return (
    <div>
      <div
        onClick={() => router.push(`/tickets/${ticket.id}`)}
        className="luxe-card rounded-3xl overflow-hidden hover:scale-[1.01] transition-all duration-500 card-hover group flex flex-col md:flex-row cursor-pointer"
      >
        {/* Left — event details */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <span className="pill-green">CONFIRMED</span>
            <span className="text-xs text-taupe">
              Pass #{ticket.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <h3 className="font-display text-2xl font-bold text-ivory mb-1 group-hover:text-gold transition-colors">
            {ticket.event.title}
          </h3>
          <p className="text-sm text-taupe mb-6">{ticket.quantity} ticket{ticket.quantity !== 1 ? 's' : ''}</p>

          <div className="space-y-3 text-sm text-ivory/70">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gold/60 flex-shrink-0" />
              <span className="font-medium">
                {format(new Date(ticket.event.date), 'EEEE, MMMM dd, yyyy • h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gold/60 flex-shrink-0" />
              <span className="font-medium">{ticket.event.venue}</span>
            </div>
            <div className="flex items-center gap-3">
              <Ticket className="w-4 h-4 text-gold/60 flex-shrink-0" />
              <span className="font-medium">KES {ticket.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {ticket.qrCodeImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(ticket)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Link href={`/events/${ticket.event.id}`}>
              <Button variant="outline" size="sm">
                View Event
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCalendar(ticket)}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>

        {/* Perforated divider (desktop) */}
        <div className="hidden md:flex items-center relative px-0">
          <div className="w-px h-full bg-gold/15 relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-4 h-4 rounded-full bg-onyx border border-gold/20" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-4 h-4 rounded-full bg-onyx border border-gold/20" />
            <Scissors className="w-4 h-4 text-gold/40 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right — QR code + price */}
        <div className="md:w-72 p-6 md:p-8 bg-coal/40 border-t md:border-t-0 md:border-l border-gold/10 flex flex-col items-center justify-center">
          {ticket.qrCodeImage && (
            <div className="p-4 bg-white rounded-2xl mb-4 shadow-premium-lg">
              <img
                src={ticket.qrCodeImage}
                alt="QR Code"
                className="w-44 h-44 max-w-full object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          )}
          {ticket.qrCodeData && (
            <div className="p-2.5 bg-coal/60 rounded-lg border border-white/10 w-full">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-taupe flex-1 break-all font-mono line-clamp-1">
                  {ticket.qrCodeData}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(ticket)}
                  className="shrink-0 text-gold hover:text-gold-light"
                >
                  {copiedId === ticket.id ? (
                    <Check className="w-4 h-4 text-gold" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-taupe mb-1">Admit {ticket.quantity} guest{ticket.quantity !== 1 ? 's' : ''}</p>
            <p className="font-display text-xl font-bold gradient-text">KES {ticket.price.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

