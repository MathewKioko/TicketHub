'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Users, Calendar, CheckCircle, Ticket, DollarSign, Building2, Plus, LayoutGrid, ArrowRight, TrendingUp } from 'lucide-react'

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
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch dashboard data')
      }
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
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading platform data...</p>
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
      <DashboardSidebar role="admin" />

      <main className="flex-1 min-w-0 bg-luxe">
        {/* Header */}
        <header className="glass-dark border-b border-gold/10">
          <div className="px-6 md:px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in-up">
                <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Platform Oversight</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                  Admin <span className="gradient-text italic">Console</span>
                </h1>
                <p className="text-taupe mt-1">Manage the TicketHub platform</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers.toLocaleString() || '0'}
              icon={<Users className="w-6 h-6" />}
              color="from-gold-light to-gold"
            />
            <StatCard
              title="Total Events"
              value={stats?.totalEvents.toLocaleString() || '0'}
              icon={<Calendar className="w-6 h-6" />}
              color="from-gold to-gold-dark"
            />
            <StatCard
              title="Published Events"
              value={stats?.publishedEvents.toLocaleString() || '0'}
              icon={<CheckCircle className="w-6 h-6" />}
              color="from-gold-dark to-gold-deepest"
            />
            <StatCard
              title="Tickets Sold"
              value={stats?.totalTicketsSold.toLocaleString() || '0'}
              icon={<Ticket className="w-6 h-6" />}
              color="from-ash to-slateish"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={<DollarSign className="w-6 h-6" />}
              color="from-gold-light to-gold"
            />
            <StatCard
              title="Platform Fees"
              value={formatCurrency(stats?.totalPlatformFees || 0)}
              icon={<Building2 className="w-6 h-6" />}
              color="from-ash to-slateish"
            />
          </div>

          {/* Top Events & Recent Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Events by Revenue */}
            <div className="luxe-card rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold text-ivory mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Top Events by Revenue
              </h3>
              {topEvents.length > 0 ? (
                <div className="space-y-4">
                  {topEvents.map((event, index) => (
                    <div key={event.eventId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-9 h-9 bg-gold/10 border border-gold/20 text-gold rounded-full text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-ivory font-medium">{event.title}</span>
                      </div>
                      <span className="text-gold font-semibold">
                        {formatCurrency(event.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-taupe text-center py-6">No events yet</p>
              )}
            </div>

            {/* Recent Payments */}
            <div className="luxe-card rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold text-ivory mb-5 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Recent Payments
              </h3>
              {recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <p className="text-ivory font-medium">{payment.user.name}</p>
                        <p className="text-sm text-taupe">{payment.event.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-ivory font-semibold">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span className={`pill ${
                          payment.status === 'success'
                            ? 'pill-green'
                            : payment.status === 'pending'
                            ? 'pill-amber'
                            : 'pill-red'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-taupe text-center py-6">No payments yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 luxe-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-ivory mb-5">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <QuickAction
                href="/events/create"
                icon={<Plus className="w-5 h-5" />}
                label="Create Event"
              />
              <QuickAction
                href="/dashboard/admin/users"
                icon={<Users className="w-5 h-5" />}
                label="Manage Users"
              />
              <QuickAction
                href="/dashboard/admin/users"
                icon={<LayoutGrid className="w-5 h-5" />}
                label="Audit Logs"
              />
              <QuickAction
                href="/dashboard/admin/payouts"
                icon={<DollarSign className="w-5 h-5" />}
                label="Payouts"
              />
            </div>
          </div>
        </main>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className={`luxe-card rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-taupe mb-1">{title}</p>
          <p className="font-display text-2xl font-bold text-ivory">{value}</p>
        </div>
        <div className={`bg-gradient-to-br ${color} p-3.5 rounded-xl shadow-glow`}>
          <span className="text-onyx">{icon}</span>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label }: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 bg-gold/5 border border-gold/15 text-gold rounded-xl hover:bg-gold/10 hover:border-gold/30 transition-all group"
    >
      <span className="flex items-center gap-3">
        <span className="text-gold">{icon}</span>
        <span className="text-sm font-medium text-ivory/80 group-hover:text-gold">{label}</span>
      </span>
      <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  )
}

