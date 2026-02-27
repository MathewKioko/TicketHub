'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  icon: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`${color} p-3 rounded-xl`}>
          <span className="text-2xl">{icon}</span>
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/owner" className="text-2xl font-bold text-indigo-600">
                TicketHub
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Event Owner Dashboard
              </span>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard/owner" className="text-gray-700 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/events/create" className="text-gray-700 hover:text-indigo-600">
                Create Event
              </Link>
              <Link href="/events" className="text-gray-700 hover:text-indigo-600">
                Browse Events
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={stats?.totalEvents.toString() || '0'}
            subtitle={`${stats?.publishedEvents || 0} published`}
            icon="📅"
            color="bg-purple-500"
          />
          <StatCard
            title="Tickets Sold"
            value={stats?.totalTicketsSold.toString() || '0'}
            subtitle="All time"
            icon="🎫"
            color="bg-orange-500"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            subtitle="All time"
            icon="💰"
            color="bg-green-500"
          />
          <StatCard
            title="Pending Payouts"
            value={formatCurrency(stats?.pendingPayouts || 0)}
            subtitle="Available"
            icon="💵"
            color="bg-blue-500"
          />
        </div>

        {/* My Events */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
            <Link
              href="/events/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Create Event
            </Link>
          </div>
          
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Venue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tickets</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{event.title}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(event.date)}</td>
                      <td className="py-4 px-4 text-gray-600">{event.venue}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {event.ticketsSold} / {event.totalTickets}
                      </td>
                      <td className="py-4 px-4 text-green-600 font-medium">
                        {formatCurrency(event.totalRevenue)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/events/${event.id}/manage`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
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
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't created any events yet</p>
              <Link
                href="/events/create"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Event
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Ticket Sales
          </h3>
          {recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-gray-900 font-medium">{sale.user.name}</p>
                    <p className="text-sm text-gray-500">{sale.event.title}</p>
                    <p className="text-xs text-gray-400">{sale.ticketType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : sale.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(sale.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No ticket sales yet</p>
          )}
        </div>

        {/* Payout Settings */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payout Settings
          </h3>
          <p className="text-gray-600 mb-4">
            Set up your Paystack subaccount to receive payouts automatically.
          </p>
          <Link
            href="/dashboard/owner/profile"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Manage Payout Settings
          </Link>
        </div>
      </main>
    </div>
  )
}
