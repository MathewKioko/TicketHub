'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Calendar,
  DollarSign,
  Users,
  Ticket,
  Plus,
  TrendingUp,
  BarChart3,
  Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: string
  venue: string
  basePrice: number
  _count: {
    tickets: number
  }
}

interface Stats {
  totalEvents: number
  totalRevenue: number
  totalTickets: number
  upcomingEvents: number
}

export default function OrganizerDashboard() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalRevenue: 0,
    totalTickets: 0,
    upcomingEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/events?organizerId=me', {
          next: { revalidate: 60 } // Cache for 60 seconds
        }),
        fetch('/api/dashboard/stats', {
          next: { revalidate: 60 } // Cache for 60 seconds
        }),
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="glass border-b border-white/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
                Organizer <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-xl text-gray-600">Manage your events and track performance</p>
            </div>
            <Link href="/events/create">
              <Button size="lg" className="animate-scale-in">
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="animate-scale-in-bounce" style={{ animationDelay: '0ms' }}>
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-premium-lg shadow-primary-500/40 hover:shadow-glow-xl hover:shadow-primary-500/60 transition-all duration-500 hover:scale-110 card-hover shine">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm mb-2 font-bold">Total Events</p>
                  <p className="text-4xl font-extrabold text-shadow-lg">{stats.totalEvents}</p>
                </div>
                <Calendar className="w-14 h-14 opacity-70 animate-float-slow" />
              </div>
            </Card>
          </div>

          <div className="animate-scale-in-bounce" style={{ animationDelay: '100ms' }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-premium-lg shadow-green-500/40 hover:shadow-glow-xl hover:shadow-green-500/60 transition-all duration-500 hover:scale-110 card-hover shine">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-2 font-bold">Total Revenue</p>
                  <p className="text-4xl font-extrabold text-shadow-lg">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-14 h-14 opacity-70 animate-float-slow" />
              </div>
            </Card>
          </div>

          <div className="animate-scale-in-bounce" style={{ animationDelay: '200ms' }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-premium-lg shadow-purple-500/40 hover:shadow-glow-xl hover:shadow-purple-500/60 transition-all duration-500 hover:scale-110 card-hover shine">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-2 font-bold">Tickets Sold</p>
                  <p className="text-4xl font-extrabold text-shadow-lg">{stats.totalTickets}</p>
                </div>
                <Ticket className="w-14 h-14 opacity-70 animate-float-slow" />
              </div>
            </Card>
          </div>

          <div className="animate-scale-in-bounce" style={{ animationDelay: '300ms' }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-premium-lg shadow-orange-500/40 hover:shadow-glow-xl hover:shadow-orange-500/60 transition-all duration-500 hover:scale-110 card-hover shine">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-2 font-bold">Upcoming</p>
                  <p className="text-4xl font-extrabold text-shadow-lg">{stats.upcomingEvents}</p>
                </div>
                <TrendingUp className="w-14 h-14 opacity-70 animate-float-slow" />
              </div>
            </Card>
          </div>
        </div>

        {/* Events List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">Your Events</h2>
            <Link href="/events/create">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <OrganizerEventCard key={event.id} event={event} index={index} />
            ))}
          </div>

          {events.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-gray-500 mb-4">No events yet</p>
              <Link href="/events/create">
                <Button>Create Your First Event</Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card variant="elevated">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/events/create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-5 h-5 mr-2" />
                Scanner App
              </Button>
            </Link>
            <Link href="/dashboard/organizer/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Memoized Event Card Component for Performance
const OrganizerEventCard = memo(({ event, index }: { event: Event; index: number }) => {
  const formattedDate = useMemo(() => format(new Date(event.date), 'MMM dd, yyyy • h:mm a'), [event.date])
  const revenue = useMemo(() => (event._count.tickets * event.basePrice).toFixed(2), [event._count.tickets, event.basePrice])

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <Card variant="elevated" className="hover:shadow-glow transition-all duration-300 cursor-pointer hover-lift">
        <Link href={`/events/${event.id}/manage`}>
          <div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary-600 transition-colors">{event.title}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                <span className="font-medium">{event.venue}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Tickets Sold</div>
                <div className="font-bold text-lg text-gray-900">{event._count.tickets}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium mb-1">Revenue</div>
                <div className="font-bold text-lg gradient-text">
                  ${revenue}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </div>
  )
})

OrganizerEventCard.displayName = 'OrganizerEventCard'

