'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Calendar, Ticket, DollarSign, Building2, Plus, ArrowRight, TrendingUp } from 'lucide-react'

interface OwnerStats {
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  totalRevenue: number
  pendingPayouts: number
}

interface Event {
  id: string
  title: string
  status: string
  date: string
  venue: string
  totalTickets: number
  ticketsSold: number
  totalRevenue: number
}

interface TicketSale {
  id: string
  ticketType: string
  status: string
  createdAt: string
  user: { name: string; email: string }
  event: { title: string }
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="luxe-card rounded-2xl p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-taupe mb-1">{title}</p>
          <p className="font-display text-2xl font-bold text-ivory">{value}</p>
          <p className="text-xs text-taupe/60 mt-1">{subtitle}</p>
        </div>
        <div className={`bg-gradient-to-br ${color} p-3.5 rounded-xl shadow-glow`}>
          <span className="text-onyx">{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<OwnerStats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [recentSales, setRecentSales] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserName(userData.user?.name || '')
      }

      const response = await fetch('/api/owner/dashboard')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setStats(data.stats)
      setEvents(data.events || [])
      setRecentSales(data.recentTickets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="glass-luxe rounded-xl p-10 max-w-md w-full text-center">
          <h2 className="font-display text-xl font-semibold text-blush mb-2">Error</h2>
          <p className="text-taupe mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-semibold hover:shadow-glow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-onyx flex">
      <DashboardSidebar role="owner" userName={userName} />

      <main className="flex-1 min-w-0 bg-luxe">
        {/* Header */}
        <header className="glass-dark border-b border-gold/10">
          <div className="px-6 md:px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in-up">
                {userName && (
                  <p className="text-gold font-medium mb-1">Welcome back, {userName}</p>
                )}
                <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Portfolio Oversight</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                  Owner <span className="gradient-text italic">Console</span>
                </h1>
                <p className="text-taupe mt-1">Manage your events and revenue</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Total Events"
              value={stats?.totalEvents.toString() || '0'}
              subtitle={`${stats?.publishedEvents || 0} published`}
              icon={<Calendar className="w-6 h-6" />}
              color="from-gold-light to-gold"
            />
            <StatCard
              title="Tickets Sold"
              value={stats?.totalTicketsSold.toString() || '0'}
              subtitle="All time"
              icon={<Ticket className="w-6 h-6" />}
              color="from-gold to-gold-dark"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              subtitle="All time"
              icon={<DollarSign className="w-6 h-6" />}
              color="from-gold-dark to-gold-deepest"
            />
            <StatCard
              title="Pending Payouts"
              value={formatCurrency(stats?.pendingPayouts || 0)}
              subtitle="Available"
              icon={<Building2 className="w-6 h-6" />}
              color="from-ash to-slateish"
            />
          </div>

          {/* My Events */}
          <div className="luxe-card rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-ivory">My Events</h3>
              <Link
                href="/events/create"
                className="px-5 py-2.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-semibold hover:shadow-glow-lg hover:scale-105 transition-all"
              >
                + Create Event
              </Link>
            </div>

            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Venue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Tickets</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-taupe">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-gold/5">
                        <td className="py-4 px-4">
                          <span className="font-medium text-ivory">{event.title}</span>
                        </td>
                        <td className="py-4 px-4 text-taupe">{formatDate(event.date)}</td>
                        <td className="py-4 px-4 text-taupe">{event.venue}</td>
                        <td className="py-4 px-4 text-taupe">
                          {event.ticketsSold} / {event.totalTickets}
                        </td>
                        <td className="py-4 px-4 text-gold font-medium">
                          {formatCurrency(event.totalRevenue)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`pill ${
                            event.status === 'PUBLISHED'
                              ? 'pill-green'
                              : event.status === 'DRAFT'
                              ? 'pill-muted'
                              : 'pill-red'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/events/${event.id}/manage`}
                            className="text-gold hover:text-gold-light text-sm font-medium"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14">
                <p className="text-taupe mb-6">You haven't created any events yet</p>
                <Link
                  href="/events/create"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-semibold hover:shadow-glow-lg transition-all"
                >
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="luxe-card rounded-2xl p-6 mb-10">
            <h3 className="font-display text-lg font-semibold text-ivory mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Recent Ticket Sales
            </h3>
            {recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <p className="text-ivory font-medium">{sale.user.name}</p>
                      <p className="text-sm text-taupe">{sale.event.title}</p>
                      <p className="text-xs text-taupe/60">{sale.ticketType}</p>
                    </div>
                    <div className="text-right">
                      <span className={`pill ${
                        sale.status === 'CONFIRMED'
                          ? 'pill-green'
                          : sale.status === 'PENDING'
                          ? 'pill-amber'
                          : 'pill-muted'
                      }`}>
                        {sale.status}
                      </span>
                      <p className="text-xs text-taupe/60 mt-1">
                        {formatDate(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-taupe text-center py-6">No ticket sales yet</p>
            )}
          </div>

          {/* Payout Settings */}
          <div className="luxe-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-ivory mb-4">
              Payout Settings
            </h3>
            <p className="text-taupe mb-6">
              Set up your Paystack subaccount to receive payouts automatically.
            </p>
            <Link
              href="/dashboard/owner/profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-semibold hover:shadow-glow-lg transition-all group"
            >
              Manage Payout Settings
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </main>
      </main>
    </div>
  )
}

