'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Ticket, QrCode, Download, Copy, Check, CalendarPlus, Sparkles, ArrowRight } from 'lucide-react'
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
    verifyPendingPayments()
  }, [])

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
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-kenyan-green/30 border-t-kenyan-green rounded-full animate-spin" />
          <p className="text-kenyan-cream/60">Loading tickets...</p>
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
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <div className="glass-dark border-b border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kenyan-green to-kenyan-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                  My <span className="gradient-text">Tickets</span>
                </h1>
              </div>
              <p className="text-kenyan-cream/60">View and manage your event tickets</p>
            </div>
            <Link href="/events">
              <Button size="lg" className="animate-scale-in bg-gradient-to-r from-kenyan-green to-kenyan-accent">
                Browse Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Events */}
        {upcomingTickets.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-kenyan-green" />
              Upcoming Events
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTickets.map((ticket, index) => (
                <div key={ticket.id} className="glass-dark rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 card-hover group">
                  {ticket.event.imageUrl && (
                    <div className="relative overflow-hidden -mx-6 -mt-6 mb-4">
                      <img
                        src={ticket.event.imageUrl}
                        alt={ticket.event.title}
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-kenyan-black/80 via-kenyan-black/20 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1.5 bg-kenyan-green/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                          CONFIRMED
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="px-5 pb-5">
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-kenyan-gold transition-colors line-clamp-1">
                      {ticket.event.title}
                    </h3>
                    <div className="space-y-2 text-sm text-kenyan-cream/70 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-kenyan-green flex-shrink-0" />
                        <span>{format(new Date(ticket.event.date), 'MMM dd, yyyy • h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-kenyan-gold flex-shrink-0" />
                        <span className="truncate">{ticket.event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-kenyan-red flex-shrink-0" />
                        <span>{ticket.quantity} ticket{ticket.quantity !== 1 ? 's' : ''} • KES {ticket.price.toLocaleString()}</span>
                      </div>
                    </div>

                    {ticket.qrCodeImage && (
                      <div className="mb-4 space-y-3">
                        <div className="p-4 bg-white rounded-xl flex items-center justify-center">
                          <img
                            src={ticket.qrCodeImage}
                            alt="QR Code"
                            className="w-40 h-40 max-w-full object-contain"
                            style={{ imageRendering: 'crisp-edges' }}
                          />
                        </div>
                        {ticket.qrCodeData && (
                          <div className="p-3 bg-kenyan-black/50 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-kenyan-cream/60 flex-1 break-all font-mono">
                                {ticket.qrCodeData}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyQRCodeData(ticket)}
                                className="shrink-0 text-kenyan-gold hover:text-kenyan-cream"
                              >
                                {copiedId === ticket.id ? (
                                  <Check className="w-4 h-4 text-kenyan-green" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
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
                            className="flex-1 border-white/20 text-kenyan-cream hover:bg-white/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Link href={`/events/${ticket.event.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-white/20 text-kenyan-cream hover:bg-white/10">
                            View Event
                          </Button>
                        </Link>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => addToCalendar(ticket)}
                        className="w-full bg-kenyan-green/20 text-kenyan-green hover:bg-kenyan-green/30"
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastTickets.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-kenyan-gold" />
              Past Events
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTickets.map(ticket => (
                <div key={ticket.id} className="glass-dark rounded-xl overflow-hidden opacity-75">
                  {ticket.event.imageUrl && (
                    <img
                      src={ticket.event.imageUrl}
                      alt={ticket.event.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="px-4 py-4">
                    <h3 className="text-lg font-semibold mb-2 text-white line-clamp-1">{ticket.event.title}</h3>
                    <div className="space-y-2 text-sm text-kenyan-cream/60 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(ticket.event.date), 'MMM dd, yyyy')}
                      </div>
                      {ticket.checkedInAt && (
                        <div className="flex items-center gap-2 text-kenyan-green">
                          <QrCode className="w-4 h-4" />
                          Attended
                        </div>
                      )}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'CHECKED_IN'
                        ? 'bg-kenyan-green/20 text-kenyan-green'
                        : 'bg-kenyan-cream/10 text-kenyan-cream/60'
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
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-kenyan-green/10 flex items-center justify-center">
              <Ticket className="w-10 h-10 text-kenyan-green" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tickets yet</h3>
            <p className="text-kenyan-cream/60 mb-6">Start exploring events and book your first ticket!</p>
            <Link href="/events">
              <Button className="bg-gradient-to-r from-kenyan-green to-kenyan-accent">
                Browse Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
