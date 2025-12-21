'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Download, Ticket, ArrowLeft, CalendarPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadTicketReceipt } from '@/lib/ticket-receipt'
import { downloadCalendarFile } from '@/lib/calendar'

interface TicketData {
  id: string
  price: number
  quantity: number
  status: string
  qrCodeImage?: string
  qrCodeData?: string
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

function TicketSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchTickets()
      // Verify payment status after loading tickets
      setTimeout(() => verifyPaymentStatus(), 1000)
    }
  }, [sessionId])

  const verifyPaymentStatus = async () => {
    if (!sessionId) return
    
    try {
      const res = await fetch(`/api/tickets/verify-payment?sessionId=${sessionId}`)
      const data = await res.json()
      if (res.ok && data.confirmed && data.updated) {
        // Refresh tickets if status was updated
        setTimeout(() => fetchTickets(), 500)
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets/session/${sessionId}`)
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

  const downloadTicket = async (ticket: TicketData) => {
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
        price: ticket.price || 0,
        quantity: ticket.quantity || 1,
        status: ticket.status || 'CONFIRMED',
        qrCodeImage: ticket.qrCodeImage,
        qrCodeData: ticket.qrCodeData,
      })
      toast.success('Ticket receipt downloaded!')
    } catch (error) {
      console.error('Error downloading ticket:', error)
      toast.error('Failed to download ticket receipt')
    }
  }

  const addToCalendar = (ticket: TicketData) => {
    try {
      const eventDate = new Date(ticket.event.date)
      // Use event endDate if available, otherwise add 2 hours as default
      const endDate = ticket.event.endDate 
        ? new Date(ticket.event.endDate)
        : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)

      downloadCalendarFile({
        title: ticket.event.title,
        description: `Event: ${ticket.event.title}\n\nYou have ${ticket.quantity || 1} ticket${(ticket.quantity || 1) !== 1 ? 's' : ''} for this event.\n\nPrice: $${((ticket.price || 0) * (ticket.quantity || 1)).toFixed(2)}\n\nDon't forget to bring your ticket QR code!`,
        location: ticket.event.venue,
        startDate: eventDate,
        endDate: endDate,
        organizer: ticket.user ? {
          name: ticket.user.name,
          email: ticket.user.email,
        } : undefined,
      }, `event-${ticket.event.title.replace(/[^a-z0-9]/gi, '_')}.ics`)

      toast.success('Calendar event downloaded! Import it into your calendar app.')
    } catch (error) {
      console.error('Error adding to calendar:', error)
      toast.error('Failed to generate calendar file')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 flex items-center justify-center p-4">
      <div className="container mx-auto px-4 py-12">
        <Card variant="elevated" className="max-w-2xl mx-auto text-center animate-scale-in-bounce premium-border shine">
          <div className="mb-8 animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <CheckCircle className="w-28 h-28 text-green-500 mx-auto animate-scale-in-bounce" />
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl animate-pulse-glow" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 text-shadow-lg">
              Payment <span className="gradient-text-slow text-glow">Successful!</span>
            </h1>
            <p className="text-xl text-gray-600">
              Your tickets have been confirmed. You'll receive an email confirmation shortly.
            </p>
          </div>

          {tickets.length > 0 && (
            <div className="space-y-4 mb-6">
              {tickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border-2 border-primary-200/50 animate-fade-in-up hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{ticket.event.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(ticket.event.date).toLocaleDateString()}
                      </p>
                    </div>
                    {ticket.qrCodeImage && (
                      <div className="p-4 bg-white rounded-lg border-4 border-gray-900 shadow-2xl">
                        <img
                          src={ticket.qrCodeImage}
                          alt="QR Code - Scan with any QR scanner"
                          className="w-56 h-56 max-w-full object-contain"
                          style={{ 
                            imageRendering: 'crisp-edges',
                            minWidth: '224px',
                            minHeight: '224px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {ticket.qrCodeImage && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTicket(ticket)}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ticket
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addToCalendar(ticket)}
                className="w-full"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/attendee">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                View All Tickets
              </Button>
            </Link>
            <Link href="/events">
              <Button>
                <Ticket className="w-4 h-4 mr-2" />
                Browse More Events
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <TicketSuccessContent />
    </Suspense>
  )
}

