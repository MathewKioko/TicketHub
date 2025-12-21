'use client'

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, DollarSign, Users, Ticket, ArrowLeft, CreditCard, Smartphone } from 'lucide-react'
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
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'MPESA'>('STRIPE')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mpesaProcessing, setMpesaProcessing] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time ticket count updates via WebSocket (BEAST LEVEL: Real-time)
  const handleTicketCountUpdate = useCallback((newCount: number) => {
    if (event) {
      setEvent({
        ...event,
        _count: {
          tickets: newCount,
        },
      })
      // Show subtle notification (only if count changed significantly)
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
        next: { revalidate: 10 } // Cache for 10 seconds
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
    // Auto-refresh event data to update ticket count
    const interval = setInterval(() => {
      fetchEvent()
    }, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [fetchEvent])

  // Cleanup polling on unmount
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

    // Validate M-Pesa phone number if selected
    if (paymentMethod === 'MPESA') {
      const cleanedPhone = phoneNumber.replace(/\D/g, '')
      if (!cleanedPhone || cleanedPhone.length < 9) {
        toast.error('Please enter a valid phone number (e.g., 254712345678)')
        return
      }
    }

    setBooking(true)
    try {
      // Create tickets
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, quantity }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tickets')
      }

      // Store userId in localStorage for later ticket fetching
      if (data.userId) {
        localStorage.setItem('Ticket Hub_userId', data.userId)
      }

      const ticketIds = data.tickets.map((t: { id: string }) => t.id)

      if (ticketIds.length === 0) {
        throw new Error('No tickets created')
      }

      if (paymentMethod === 'MPESA') {
        // Handle M-Pesa payment
        const cleanedPhone = phoneNumber.replace(/\D/g, '')
        let formattedPhone = cleanedPhone
        if (cleanedPhone.startsWith('0')) {
          formattedPhone = '254' + cleanedPhone.substring(1)
        } else if (!cleanedPhone.startsWith('254')) {
          formattedPhone = '254' + cleanedPhone
        }

        const mpesaRes = await fetch('/api/mpesa/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketIds, phoneNumber: formattedPhone }),
        })

        const mpesaData = await mpesaRes.json()

        if (!mpesaRes.ok) {
          throw new Error(mpesaData.error || 'M-Pesa payment failed')
        }

        setCheckoutRequestId(mpesaData.checkoutRequestId)
        setMpesaProcessing(true)
        toast.success(mpesaData.message || 'M-Pesa payment request sent to your phone!')
        
        // Start polling for payment status
        pollMpesaStatus(mpesaData.checkoutRequestId)
      } else {
        // Handle Stripe payment
        const checkoutRes = await fetch('/api/tickets/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketIds }),
        })

        const checkoutData = await checkoutRes.json()

        if (!checkoutRes.ok) {
          throw new Error(checkoutData.error || 'Checkout failed')
        }

        // Redirect to Stripe checkout
        if (checkoutData.url) {
          window.location.href = checkoutData.url
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error)
      toast.error(error.message || 'Failed to book tickets')
      setMpesaProcessing(false)
      setCheckoutRequestId(null)
    } finally {
      setBooking(false)
    }
  }

  const stopMpesaPolling = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setMpesaProcessing(false)
    setCheckoutRequestId(null)
    toast('Payment cancelled. You can try again.', { icon: 'ℹ️' })
  }

  const pollMpesaStatus = async (requestId: string) => {
    const maxAttempts = 30 // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0
    let backoffDelay = 10000 // Start with 10 seconds

    const poll = async () => {
      if (attempts >= maxAttempts) {
        stopMpesaPolling()
        toast.error('Payment timeout. Please check your M-Pesa and try again.')
        return
      }

      try {
        const res = await fetch('/api/mpesa/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId: requestId }),
        })

        const data = await res.json()

        if (res.status === 500 && data.error) {
          // Handle API errors (rate limiting, etc.)
          if (data.error.includes('rate limit')) {
            // Exponential backoff for rate limiting
            backoffDelay = Math.min(backoffDelay * 1.5, 60000) // Max 60 seconds
            attempts++
            pollingTimeoutRef.current = setTimeout(poll, backoffDelay)
            console.log(`Rate limited, backing off to ${backoffDelay}ms`)
            return
          } else {
            // Other API errors
            stopMpesaPolling()
            toast.error(data.error || 'Failed to check payment status')
            return
          }
        }

        if (data.status === 'success') {
          stopMpesaPolling()
          toast.success('Payment confirmed! Redirecting to your tickets...')
          setTimeout(() => {
            router.push('/dashboard/attendee')
          }, 2000)
        } else if (data.resultCode && data.resultCode !== 0) {
          // Payment cancelled or failed
          stopMpesaPolling()
          if (data.resultCode === 1032) {
            toast.error('Payment cancelled. Please try again if you want to complete the booking.')
          } else {
            toast.error(`Payment failed: ${data.resultDesc || 'Unknown error'}`)
          }
        } else {
          // Still pending, continue polling (reset backoff)
          backoffDelay = 10000
          attempts++
          pollingTimeoutRef.current = setTimeout(poll, backoffDelay)
        }
      } catch (error) {
        console.error('Error polling M-Pesa status:', error)
        // Exponential backoff on network errors
        backoffDelay = Math.min(backoffDelay * 1.5, 60000)
        attempts++
        pollingTimeoutRef.current = setTimeout(poll, backoffDelay)
      }
    }

    poll()
  }

  const calculateTotal = () => {
    return event ? event.basePrice * quantity : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/events" 
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8 font-semibold hover:scale-105 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Events
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {event.imageUrl && (
              <div className="relative overflow-hidden rounded-2xl shadow-premium-lg group premium-border">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-64 md:h-96 object-cover transition-transform duration-1000 group-hover:scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-700" />
              </div>
            )}

            <Card variant="elevated" className="animate-fade-in-up premium-border shine">
              <h1 className="text-5xl font-extrabold text-gray-900 mb-6 gradient-text text-shadow">{event.title}</h1>
              <p className="text-gray-600 mb-6 whitespace-pre-line">{event.description}</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <div>
                    <div className="font-semibold">
                      {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(event.date), 'h:mm a')}
                      {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold">{event.venue}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold">
                    {event.currency} {event.basePrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span className="flex items-center gap-2">
                    <span>{event._count.tickets} tickets sold</span>
                    <span className="text-xs text-green-500 animate-pulse">● Live</span>
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-500">Organized by </span>
                  <span className="font-semibold text-primary-600">{event.organizer.name}</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-8 animate-scale-in-bounce premium-border shine">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 gradient-text">Book Tickets</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 hover:text-primary-600 flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold w-16 text-center text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 hover:text-primary-600 flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-6 p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl border-2 border-primary-200/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">
                    {quantity} ticket{quantity !== 1 ? 's' : ''}
                  </span>
                  <span className="text-3xl font-extrabold gradient-text">
                    {event.currency} {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('STRIPE')
                      setMpesaProcessing(false)
                    }}
                    disabled={mpesaProcessing}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      paymentMethod === 'STRIPE'
                        ? 'border-primary-500 bg-primary-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${mpesaProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'STRIPE' ? 'text-primary-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-semibold ${paymentMethod === 'STRIPE' ? 'text-primary-700' : 'text-gray-700'}`}>
                      Stripe
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('MPESA')
                      setMpesaProcessing(false)
                    }}
                    disabled={mpesaProcessing}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      paymentMethod === 'MPESA'
                        ? 'border-primary-500 bg-primary-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${mpesaProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    <Smartphone className={`w-6 h-6 ${paymentMethod === 'MPESA' ? 'text-primary-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-semibold ${paymentMethod === 'MPESA' ? 'text-primary-700' : 'text-gray-700'}`}>
                      M-Pesa
                    </span>
                  </button>
                </div>
              </div>

              {/* M-Pesa Phone Number Input */}
              {paymentMethod === 'MPESA' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="254712345678"
                    disabled={mpesaProcessing}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-400 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter your M-Pesa number (e.g., 254712345678)
                  </p>
                </div>
              )}

              {/* M-Pesa Processing Status */}
              {mpesaProcessing && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Waiting for payment...
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Please complete the payment on your phone
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={stopMpesaPolling}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBookTickets}
                disabled={booking || quantity < 1 || mpesaProcessing}
                className="w-full"
                size="lg"
              >
                {booking ? (
                  'Processing...'
                ) : mpesaProcessing ? (
                  'Waiting for Payment...'
                ) : (
                  <>
                    <Ticket className="w-5 h-5 mr-2" />
                    Book Now
                  </>
                )}
              </Button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                {paymentMethod === 'STRIPE' 
                  ? 'Secure payment powered by Stripe'
                  : 'Secure payment via M-Pesa STK Push'
                }
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

