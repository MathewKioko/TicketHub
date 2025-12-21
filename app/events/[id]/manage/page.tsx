'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Users, DollarSign, Ticket, CheckCircle, ArrowLeft } from 'lucide-react'
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
    const interval = setInterval(fetchAttendance, 5000) // Refresh every 5 seconds
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
          <Link href="/dashboard/organizer">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/organizer"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
          <p className="text-gray-600">{event.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Tickets Sold</p>
                <p className="text-3xl font-bold">{event._count.tickets}</p>
              </div>
              <Ticket className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Checked In</p>
                <p className="text-3xl font-bold">{stats?.checkedInCount || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold">{stats?.attendanceRate.toFixed(1) || 0}%</p>
              </div>
              <Users className="w-12 h-12 opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-semibold">
                    {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(event.date), 'h:mm a')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span className="font-semibold">${event.basePrice.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href={`/scanner`}>
                <Button className="w-full justify-start">
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

