'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Users, DollarSign, Ticket, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  venue: string
  date: string
  category: string
  basePrice: number
  _count: {
    tickets: number
  }
}

interface AttendanceStats {
  totalTickets: number
  checkedInCount: number
  attendanceRate: number
}

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
    fetchAttendance()
    const interval = setInterval(fetchAttendance, 5000)
    return () => clearInterval(interval)
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      const data = await res.json()
      if (res.ok) {
        setEvent(data.event)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`)
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="text-center glass-luxe rounded-xl p-10 max-w-md">
          <h1 className="font-display text-2xl font-bold text-ivory mb-4">Event not found</h1>
          <Link href="/dashboard/organizer">
            <Button variant="gold">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe">
      <div className="container mx-auto px-4 py-10">
        <Link
          href="/dashboard/organizer"
          className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-display text-4xl font-bold text-ivory mb-2">{event.title}</h1>
          <p className="text-taupe">{event.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-gold-light via-gold to-gold-dark text-onyx shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-onyx/70 text-sm mb-1">Tickets Sold</p>
                <p className="font-display text-3xl font-bold">{event._count.tickets}</p>
              </div>
              <Ticket className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gold via-gold-dark to-gold-deepest text-ivory shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ivory/70 text-sm mb-1">Checked In</p>
                <p className="font-display text-3xl font-bold">{stats?.checkedInCount || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-ash to-slateish border border-gold/20 shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-taupe text-sm mb-1">Attendance Rate</p>
                <p className="font-display text-3xl font-bold text-ivory">{stats?.attendanceRate.toFixed(1) || 0}%</p>
              </div>
              <Users className="w-12 h-12 text-gold opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="elevated">
            <h2 className="font-display text-2xl font-bold text-ivory mb-4">Event Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gold" />
                <div>
                  <div className="font-semibold text-ivory">
                    {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-taupe">
                    {format(new Date(event.date), 'h:mm a')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gold" />
                <span className="font-semibold text-ivory">KES {event.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="font-semibold text-ivory">{event.category}</span>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <h2 className="font-display text-2xl font-bold text-ivory mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href={`/scanner`}>
                <Button variant="gold" className="w-full justify-start">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Open Scanner
                </Button>
              </Link>
              <Link href={`/events/${eventId}`}>
                <Button variant="outline" className="w-full justify-start">
                  View Public Page
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

