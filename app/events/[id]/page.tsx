'use client'

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, DollarSign, Users, Ticket, ArrowLeft, CreditCard, Wallet, Loader2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTicketCountUpdates } from '@/lib/socket-client'

interface Event {
  id: string
  title: string
  description: string
  venue: string
  date: string
  endDate?: string
  category: string
  imageUrl?: string
  basePrice: number
  currency: string
  organizer: {
    name: string
  }
  _count: {
    tickets: number
  }
}


export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK'>('PAYSTACK')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [paystackProcessing, setPaystackProcessing] = useState(false)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time ticket count updates via WebSocket
  const handleTicketCountUpdate = useCallback((newCount: number) => {
    if (event) {
      setEvent({
        ...event,
        _count: {
          tickets: newCount,
        },
      })
      const currentCount = event._count.tickets
      if (Math.abs(newCount - currentCount) > 0) {
        toast.success(`🎫 ${newCount} tickets sold`, {
          duration: 2000,
          icon: '📊',
        })
      }
    }
  }, [event])

  useTicketCountUpdates(eventId, handleTicketCountUpdate)

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        next: { revalidate: 10 }
      })
      const data = await res.json()
      if (res.ok) {
        setEvent(data.event)
      } else {
        toast.error(data.error || 'Failed to load event')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchEvent()
    const interval = setInterval(() => {
      fetchEvent()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchEvent])

  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
      }
    }
  }, [])

  const handleBookTickets = async () => {
    if (quantity < 1) {
      toast.error('Please select quantity')
      return
    }

    setBooking(true)
    try {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, quantity }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tickets')
      }

      if (data.userId) {
        localStorage.setItem('Ticket Hub_userId', data.userId)
      }

      const ticketIds = data.tickets.map((t: { id: string }) => t.id)

      if (ticketIds.length === 0) {
        throw new Error('No tickets created')
      }

      const checkoutRes = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Checkout failed')
      }

      if (checkoutData.authorizationUrl) {
        window.location.href = checkoutData.authorizationUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (error: any) {
      console.error('Booking error:', error)
      toast.error(error.message || 'Failed to book tickets')
    } finally {
      setBooking(false)
    }
  }

  const calculateTotal = () => {
    return event ? event.basePrice * quantity : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="text-center glass-luxe rounded-2xl p-10">
          <h1 className="font-display text-2xl font-bold text-ivory mb-4">Event not found</h1>
          <Link href="/events">
            <Button variant="gold">Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
<div className="min-h-screen bg-onyx">
      {/* Hero */}
      <div className="relative h-[35vh] md:h-[45vh] overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-ash to-coal flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-gold/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/40 to-onyx/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-onyx/60 via-transparent to-onyx/40" />

        <Link
          href="/events"
          className="absolute top-5 left-4 md:top-6 md:left-6 inline-flex items-center gap-2 text-ivory/80 hover:text-gold font-medium text-sm transition-all duration-200 group z-20"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>

        <div className="absolute bottom-0 inset-x-0 z-10">
          <div className="container mx-auto px-4 pb-6 md:pb-8">
            <div className="max-w-4xl">
              <span className="pill-gold mb-3 inline-block text-[10px]">{event.category}</span>
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-ivory mb-3 leading-tight text-glow">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-ivory/80 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="font-medium">
                    {format(new Date(event.date), 'MMM dd, yyyy')} •{' '}
                    {format(new Date(event.date), 'h:mm a')}
                    {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="font-medium">{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  <span className="font-medium">{event._count.tickets} sold</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3">About This Event</p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ivory mb-4">
                The <span className="gradient-text italic">Experience</span>
              </h2>
              <p className="text-ivory/70 whitespace-pre-line font-light leading-relaxed text-lg">
                {event.description}
              </p>
            </div>

            {/* Quick facts */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="luxe-card rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-taupe mb-1">Date & Time</p>
                  <p className="font-semibold text-ivory text-sm">
                    {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-taupe">
                    {format(new Date(event.date), 'h:mm a')}
                    {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
                  </p>
                </div>
              </div>

              <div className="luxe-card rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-taupe mb-1">Venue</p>
                  <p className="font-semibold text-ivory text-sm">{event.venue}</p>
                  <p className="text-sm text-taupe">Kenya</p>
                </div>
              </div>

              <div className="luxe-card rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-taupe mb-1">Ticket Price</p>
                  <p className="font-display font-bold text-gold text-lg">
                    KES {event.basePrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="luxe-card rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-taupe mb-1">Curated by</p>
                  <p className="font-semibold text-gold-light text-sm">{event.organizer.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-24 animate-scale-in-bounce shine">
              <h2 className="font-display text-3xl font-bold text-ivory mb-2 gradient-text">Reserve</h2>
              <p className="text-xs text-taupe mb-8">Secure your place at this event</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-ivory/70 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl border border-gold/25 bg-gold/5 hover:bg-gold/15 text-gold flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-display text-2xl font-bold w-16 text-center text-ivory">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border border-gold/25 bg-gold/5 hover:bg-gold/15 text-gold flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-6 p-6 bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-2xl border border-gold/20">
                <div className="flex justify-between items-center">
                  <span className="text-ivory/70 font-medium">
                    {quantity} ticket{quantity !== 1 ? 's' : ''}
                  </span>
                  <span className="font-display text-3xl font-bold gradient-text">
                    KES {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-ivory/70 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <div
                    className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                      paymentMethod === 'PAYSTACK'
                        ? 'border-gold/40 bg-gold/10 shadow-glow'
                        : 'border-white/10 bg-coal/60'
                    }`}
                  >
                    <Wallet className={`w-6 h-6 ${paymentMethod === 'PAYSTACK' ? 'text-gold' : 'text-taupe'}`} />
                    <span className={`text-sm font-semibold ${paymentMethod === 'PAYSTACK' ? 'text-gold-light' : 'text-taupe'}`}>
                      Paystack
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBookTickets}
                disabled={booking || quantity < 1}
                className="w-full"
                size="lg"
                variant="gold"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5 mr-2" />
                    Book Now
                  </>
                )}
              </Button>

              <p className="mt-4 text-xs text-taupe text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold/60" />
                Secure payment powered by Paystack
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

