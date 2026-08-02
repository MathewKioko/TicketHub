'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import {
  Calendar,
  DollarSign,
  Users,
  Ticket,
  Plus,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
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
  const [authenticated, setAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')

  const fetchDashboardData = useCallback(async () => {
    const userId = localStorage.getItem('TicketHub_userId')
    if (!userId) {
      router.push('/auth/login')
      return
    }

    try {
      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserName(userData.user?.name || '')
      }

      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/events?organizerId=me', {
          next: { revalidate: 60 }
        }),
        fetch('/api/dashboard/stats', {
          next: { revalidate: 60 }
        }),
      ])

      if (eventsRes.status === 401 || eventsRes.status === 403) {
        router.push('/auth/login')
        return
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      setAuthenticated(true)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-onyx flex">
      <DashboardSidebar role="organizer" userName={userName} />

      <main className="flex-1 min-w-0 bg-luxe">
        {/* Header */}
        <div className="glass-dark border-b border-gold/10">
          <div className="px-6 md:px-10 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="animate-fade-in-up">
                {userName && (
                  <p className="text-gold font-medium mb-2">Welcome back, {userName}</p>
                )}
                <h1 className="font-display text-3xl md:text-5xl font-bold text-ivory mb-2">
                  Organizer <span className="gradient-text italic">Console</span>
                </h1>
                <p className="text-taupe">Manage your events and track performance</p>
              </div>
              <Link href="/events/create">
                <Button variant="gold" size="lg" className="animate-scale-in">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-10 py-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div>
              <Card className="bg-gradient-to-br from-gold-light via-gold to-gold-dark text-onyx shadow-glow-lg hover:shadow-glow-xl transition-all duration-500 hover:scale-105 card-hover shine">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-onyx/70 text-sm mb-2 font-bold">Total Events</p>
                    <p className="font-display text-4xl font-extrabold text-shadow-lg">{stats.totalEvents}</p>
                  </div>
                  <Calendar className="w-14 h-14 opacity-60 animate-float-slow" />
                </div>
              </Card>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-gold via-gold-dark to-gold-deepest text-ivory shadow-glow-lg hover:shadow-glow-xl transition-all duration-500 hover:scale-105 card-hover shine">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ivory/70 text-sm mb-2 font-bold">Total Revenue</p>
                    <p className="font-display text-4xl font-extrabold text-shadow-lg">KES {stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-14 h-14 opacity-60 animate-float-slow" />
                </div>
              </Card>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-ash to-slateish border border-gold/20 shadow-glow-lg hover:shadow-glow-xl transition-all duration-500 hover:scale-105 card-hover shine">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-taupe text-sm mb-2 font-bold">Tickets Sold</p>
                    <p className="font-display text-4xl font-extrabold text-ivory text-shadow-lg">{stats.totalTickets}</p>
                  </div>
                  <Ticket className="w-14 h-14 text-gold opacity-70 animate-float-slow" />
                </div>
              </Card>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-ash to-slateish border border-gold/20 shadow-glow-lg hover:shadow-glow-xl transition-all duration-500 hover:scale-105 card-hover shine">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-taupe text-sm mb-2 font-bold">Upcoming</p>
                    <p className="font-display text-4xl font-extrabold text-ivory text-shadow-lg">{stats.upcomingEvents}</p>
                  </div>
                  <TrendingUp className="w-14 h-14 text-gold opacity-70 animate-float-slow" />
                </div>
              </Card>
            </div>
          </div>

          {/* Events List */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ivory">Your Events</h2>
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
              <Card className="text-center py-14">
                <Sparkles className="w-12 h-12 text-gold/40 mx-auto mb-4" />
                <p className="text-taupe mb-6">No events yet</p>
                <Link href="/events/create">
                  <Button variant="gold">Create Your First Event</Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <Card variant="elevated">
            <h2 className="font-display text-2xl font-bold text-ivory mb-6">Quick Actions</h2>
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
      </main>
    </div>
  )
}

// Memoized Event Card Component for Performance
const OrganizerEventCard = memo(({ event, index }: { event: Event; index: number }) => {
  const formattedDate = useMemo(() => format(new Date(event.date), 'MMM dd, yyyy • h:mm a'), [event.date])
  const revenue = useMemo(() => (event._count.tickets * event.basePrice).toFixed(2), [event._count.tickets, event.basePrice])

  return (
    <div>
      <Card variant="elevated" className="hover:shadow-glow transition-all duration-300 cursor-pointer hover-lift">
        <Link href={`/events/${event.id}/manage`}>
          <div>
            <h3 className="font-display text-xl font-bold mb-3 text-ivory group-hover:text-gold transition-colors">{event.title}</h3>
            <div className="space-y-2 text-sm text-taupe mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold/60" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold/60" />
                <span className="font-medium">{event.venue}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 divider-gold">
              <div>
                <div className="text-xs text-taupe font-medium mb-1">Tickets Sold</div>
                <div className="font-bold text-lg text-ivory">{event._count.tickets}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-taupe font-medium mb-1">Revenue</div>
                <div className="font-bold text-lg gradient-text">
                  KES {revenue}
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

