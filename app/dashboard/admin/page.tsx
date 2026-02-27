'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  totalRevenue: number
  totalPlatformFees: number
}

interface TopEvent {
  eventId: string
  title: string
  revenue: number
}

interface RecentPayment {
  id: string
  amount: number
  status: string
  createdAt: string
  user: { name: string; email: string }
  event: { title: string }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is admin - for now just fetch data
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setStats(data.stats)
      setTopEvents(data.topEvents || [])
      setRecentPayments(data.recentPayments || [])
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
              <Link href="/dashboard/admin" className="text-2xl font-bold text-indigo-600">
                TicketHub Admin
              </Link>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                Platform Dashboard
              </span>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard/admin" className="text-gray-700 hover:text-indigo-600">
                Overview
              </Link>
              <Link href="/dashboard/organizer" className="text-gray-700 hover:text-indigo-600">
                My Events
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers.toLocaleString() || '0'}
            icon="👥"
            color="bg-blue-500"
          />
          <StatCard
            title="Total Events"
            value={stats?.totalEvents.toLocaleString() || '0'}
            icon="📅"
            color="bg-purple-500"
          />
          <StatCard
            title="Published Events"
            value={stats?.publishedEvents.toLocaleString() || '0'}
            icon="✅"
            color="bg-green-500"
          />
          <StatCard
            title="Tickets Sold"
            value={stats?.totalTicketsSold.toLocaleString() || '0'}
            icon="🎫"
            color="bg-orange-500"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon="💰"
            color="bg-yellow-500"
          />
          <StatCard
            title="Platform Fees"
            value={formatCurrency(stats?.totalPlatformFees || 0)}
            icon="🏦"
            color="bg-indigo-500"
          />
        </div>

        {/* Top Events & Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Events by Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Events by Revenue
            </h3>
            {topEvents.length > 0 ? (
              <div className="space-y-4">
                {topEvents.map((event, index) => (
                  <div key={event.eventId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 font-medium">{event.title}</span>
                    </div>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(event.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No events yet</p>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Payments
            </h3>
            {recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-gray-900 font-medium">{payment.user.name}</p>
                      <p className="text-sm text-gray-500">{payment.event.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No payments yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/events/create"
              className="flex items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <span className="text-2xl mr-2">➕</span>
              Create Event
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mr-2">👥</span>
              Manage Users
            </Link>
            <Link
              href="/dashboard/admin/audit-logs"
              className="flex items-center justify-center p-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl mr-2">📋</span>
              Audit Logs
            </Link>
            <Link
              href="/dashboard/admin/payouts"
              className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mr-2">💵</span>
              Payouts
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-xl`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}
