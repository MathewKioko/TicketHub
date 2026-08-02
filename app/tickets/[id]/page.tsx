'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Ticket, Download, ArrowLeft, CheckCircle, User, CalendarPlus, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { downloadTicketReceipt } from '@/lib/ticket-receipt'
import { downloadCalendarFile } from '@/lib/calendar'

interface TicketData {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN'
  price: number
  quantity: number
  qrCodeImage?: string
  qrCodeData?: string
  checkedInAt?: string
  stripeSessionId?: string
  stripePaymentId?: string
  event: {
    id: string
    title: string
    description: string
    date: string
    endDate?: string
    venue: string
    imageUrl?: string
  }
  user: {
    name: string
    email: string
  }
}

export default function TicketReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      const data = await res.json()
      if (res.ok) {
        setTicket(data.ticket)

        if (data.ticket.status === 'PENDING' && data.ticket.stripeSessionId) {
          checkPaymentStatus(data.ticket.stripeSessionId)
        }
      } else {
        toast.error(data.error || 'Ticket not found')
        router.push('/dashboard/attendee')
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket')
      router.push('/dashboard/attendee')
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/tickets/verify-payment?sessionId=${sessionId}`)
      const data = await res.json()
      if (res.ok && data.confirmed) {
        fetchTicket()
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const downloadTicket = async () => {
    if (!ticket?.qrCodeImage) {
      toast.error('QR code not available')
      return
    }

    try {
      await downloadTicketReceipt({
        id: ticket.id,
        event: ticket.event,
        user: ticket.user,
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

  const addToCalendar = () => {
    if (!ticket) return

    try {
      const eventDate = new Date(ticket.event.date)
      const endDate = ticket.event.endDate
        ? new Date(ticket.event.endDate)
        : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)

      downloadCalendarFile({
        title: ticket.event.title,
        description: `Event: ${ticket.event.title}\n\n${ticket.event.description || ''}\n\nYou have ${ticket.quantity} ticket${ticket.quantity !== 1 ? 's' : ''} for this event.\n\nPrice: KES ${(ticket.price * ticket.quantity).toLocaleString()}\n\nDon't forget to bring your ticket QR code!`,
        location: ticket.event.venue,
        startDate: eventDate,
        endDate: endDate,
        organizer: {
          name: ticket.user.name,
          email: ticket.user.email,
        },
      }, `event-${ticket.event.title.replace(/[^a-z0-9]/gi, '_')}.ics`)

      toast.success('Calendar event downloaded! Import it into your calendar app.')
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
          <p className="text-taupe">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <Card variant="elevated" className="max-w-md mx-auto text-center p-8">
          <h1 className="font-display text-2xl font-bold text-ivory mb-4">Ticket Not Found</h1>
          <Link href="/dashboard/attendee">
            <Button variant="gold">Back to My Tickets</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/dashboard/attendee" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to My Tickets
        </Link>

        <Card variant="elevated" className="animate-scale-in-bounce premium-border shine">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b border-gold/15">
            <div className="relative inline-block mb-4">
              <Ticket className="w-16 h-16 text-gold mx-auto" />
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ivory mb-2 gradient-text-slow text-shadow-lg">
              Your Ticket
            </h1>
            <p className="text-lg text-taupe">Event Receipt & Entry Pass</p>
          </div>

          {/* Event Image */}
          {ticket.event.imageUrl && (
            <div className="mb-6 -mx-6 -mt-6 rounded-t-2xl overflow-hidden">
              <img
                src={ticket.event.imageUrl}
                alt={ticket.event.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-ivory mb-2">{ticket.event.title}</h2>
              <p className="text-taupe leading-relaxed">{ticket.event.description}</p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-lg border border-gold/10">
                <Calendar className="w-5 h-5 text-gold" />
                <div>
                  <div className="font-semibold text-ivory">
                    {format(new Date(ticket.event.date), 'EEEE, MMMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-taupe">
                    {format(new Date(ticket.event.date), 'h:mm a')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-lg border border-gold/10">
                <MapPin className="w-5 h-5 text-gold" />
                <span className="font-semibold text-ivory">{ticket.event.venue}</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-lg border border-gold/10">
                <User className="w-5 h-5 text-gold" />
                <div>
                  <div className="font-semibold text-ivory">{ticket.user.name}</div>
                  <div className="text-sm text-taupe">{ticket.user.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-lg border border-gold/25">
                <div>
                  <div className="text-sm text-taupe mb-1">Quantity</div>
                  <div className="font-display text-2xl font-bold text-ivory">
                    {ticket.quantity} ticket{ticket.quantity !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-taupe mb-1">Total Price</div>
                  <div className="font-display text-2xl font-bold gradient-text">
                    KES {(ticket.price * ticket.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {ticket.qrCodeImage && (
            <div className="mb-6 p-6 bg-white rounded-xl border-2 border-gold flex flex-col items-center shadow-2xl">
              <p className="text-sm font-semibold text-onyx mb-3">Entry QR Code</p>
              <img
                src={ticket.qrCodeImage}
                alt="QR Code"
                className="w-64 h-64 max-w-full object-contain"
                style={{
                  imageRendering: 'crisp-edges',
                  minWidth: '256px',
                  minHeight: '256px'
                }}
              />
              <p className="text-xs text-gray-600 mt-3 text-center">
                Show this QR code at the event entrance
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="mb-6 flex justify-center">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
              ticket.status === 'CONFIRMED'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : ticket.status === 'CHECKED_IN'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : ticket.status === 'PENDING'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-taupe border-white/10'
            }`}>
              {ticket.status === 'CHECKED_IN' && <CheckCircle className="w-4 h-4" />}
              {ticket.status}
            </span>
          </div>

          {ticket.checkedInAt && (
            <div className="mb-6 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-center">
              <p className="text-sm font-semibold text-emerald-300">
                ✓ Checked in at {format(new Date(ticket.checkedInAt), 'MMM dd, yyyy • h:mm a')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {ticket.qrCodeImage && (
                <Button
                  variant="outline"
                  onClick={downloadTicket}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Ticket
                </Button>
              )}
              <Link href={`/events/${ticket.event.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Event
                </Button>
              </Link>
            </div>
            <Button
              variant="secondary"
              onClick={addToCalendar}
              className="w-full"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

