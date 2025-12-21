'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Ticket, QrCode, Download, Copy, Check, CalendarPlus } from 'lucide-react'
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
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchTickets()
    // Verify pending payments on load
    verifyPendingPayments()
  }, [])

  const verifyPendingPayments = async () => {
    try {
      const res = await fetch('/api/tickets/verify-all-pending', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.updated > 0) {
        // Refresh tickets if any were updated
        setTimeout(() => fetchTickets(), 1000)
      }
    } catch (error) {
      // Silently fail - this is just a background check
      console.error('Error verifying payments:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      // Get userId from localStorage (stored when tickets are created)
      const userId = localStorage.getItem('Ticket Hub_userId')
      const url = userId ? `/api/tickets/my?userId=${userId}` : '/api/tickets/my'
      
      const res = await fetch(url)
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
      // Use event endDate if available, otherwise add 2 hours as default
      const endDate = ticket.event.endDate 
        ? new Date(ticket.event.endDate)
        : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)

      downloadCalendarFile({
        title: ticket.event.title,
        description: `Event: ${ticket.event.title}\n\nYou have ${ticket.quantity} ticket${ticket.quantity !== 1 ? 's' : ''} for this event.\n\nPrice: $${ticket.price.toFixed(2)}\n\nDon't forget to bring your ticket QR code!`,
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
        <div className="text-xl text-gray-600">Loading tickets...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="glass border-b border-white/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
                My <span className="gradient-text">Tickets</span>
              </h1>
              <p className="text-xl text-gray-600">View and manage your event tickets</p>
            </div>
            <Link href="/events">
              <Button size="lg" className="animate-scale-in">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Events */}
        {upcomingTickets.length > 0 && (
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Upcoming Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTickets.map((ticket, index) => (
                <div key={ticket.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <Card variant="elevated" className="hover:shadow-glow transition-all duration-300 hover-lift group">
                  {ticket.event.imageUrl && (
                    <div className="relative overflow-hidden rounded-t-2xl -mx-6 -mt-6 mb-4">
                      <img
                        src={ticket.event.imageUrl}
                        alt={ticket.event.title}
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  )}
                  <div className="px-6 pb-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">{ticket.event.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(ticket.event.date), 'MMM dd, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {ticket.event.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        {ticket.quantity} ticket{ticket.quantity !== 1 ? 's' : ''} • ${ticket.price.toFixed(2)}
                      </div>
                    </div>

                    {ticket.qrCodeImage && (
                      <div className="mb-4 space-y-3">
                        <div className="p-6 bg-white rounded-xl border-4 border-gray-900 flex items-center justify-center shadow-2xl">
                          <img
                            src={ticket.qrCodeImage}
                            alt="QR Code - Scan with any QR scanner"
                            className="w-64 h-64 max-w-full object-contain"
                            style={{ 
                              imageRendering: 'crisp-edges',
                              minWidth: '256px',
                              minHeight: '256px'
                            }}
                          />
                        </div>
                        {ticket.qrCodeData && (
                          <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg border-2 border-primary-200">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-xs font-bold text-gray-800 flex-1 break-all">
                                {ticket.qrCodeData}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyQRCodeData(ticket)}
                                className="shrink-0"
                              >
                                {copiedId === ticket.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-primary-700">
                                ✓ QR Code Detected!
                              </p>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                If Google Lens shows a code starting with "690-", that's your ticket code! Copy it and use it in the scanner page.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {ticket.qrCodeImage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTicket(ticket)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Link href={`/events/${ticket.event.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Event
                          </Button>
                        </Link>
                      </div>
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

                    <div className="mt-4 pt-4 border-t">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : ticket.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {ticket.status}
                      </div>
                    </div>
                  </div>
                </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastTickets.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTickets.map(ticket => (
                <Card key={ticket.id}>
                  {ticket.event.imageUrl && (
                    <img
                      src={ticket.event.imageUrl}
                      alt={ticket.event.title}
                      className="w-full h-48 object-cover rounded-t-xl mb-4"
                    />
                  )}
                  <div className="px-6 pb-6">
                    <h3 className="text-xl font-semibold mb-2">{ticket.event.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(ticket.event.date), 'MMM dd, yyyy')}
                      </div>
                      {ticket.checkedInAt && (
                        <div className="flex items-center gap-2 text-green-600">
                          <QrCode className="w-4 h-4" />
                          Checked in
                        </div>
                      )}
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'CHECKED_IN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status === 'CHECKED_IN' ? 'Attended' : 'Past Event'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tickets.length === 0 && (
          <Card className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-6">Start exploring events and book your first ticket!</p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

