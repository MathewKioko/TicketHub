'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DollarSign, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Payout {
  id: string
  userId: string
  userName: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  completedAt?: string
  eventTitle?: string
}

export default function AdminPayoutsPage() {
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/admin/payouts')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch payouts')
      }
      const data = await response.json()
      setPayouts(data.payouts || [])
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-amber-400" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-blush" />
      default:
        return null
    }
  }

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'pill-green'
      case 'PENDING':
        return 'pill-amber'
      case 'FAILED':
        return 'pill-red'
      default:
        return 'pill-muted'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading payouts...</p>
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
            onClick={fetchPayouts}
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
            <div className="animate-fade-in-up">
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Financials</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                Payout <span className="gradient-text italic">Management</span>
              </h1>
              <p className="text-taupe mt-1">View and manage platform payouts</p>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 py-8">
          {/* Summary */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="luxe-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-light to-gold flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-onyx" />
              </div>
              <div>
                <p className="text-xs text-taupe">Total Pending</p>
                <p className="font-display text-xl font-bold text-ivory">
                  {formatCurrency(
                    payouts
                      .filter(p => p.status === 'PENDING')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="luxe-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-onyx" />
              </div>
              <div>
                <p className="text-xs text-taupe">Total Completed</p>
                <p className="font-display text-xl font-bold text-ivory">
                  {formatCurrency(
                    payouts
                      .filter(p => p.status === 'COMPLETED')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="luxe-card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ash to-slateish flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-xs text-taupe">Total Payouts</p>
                <p className="font-display text-xl font-bold text-ivory">{payouts.length}</p>
              </div>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="luxe-card rounded-2xl overflow-hidden">
            {payouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Organizer</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Event</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Amount</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Date</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-white/5 hover:bg-gold/5 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-medium text-ivory">{payout.userName}</span>
                        </td>
                        <td className="py-4 px-5 text-taupe">
                          {payout.eventTitle || '—'}
                        </td>
                        <td className="py-4 px-5 text-gold font-semibold">
                          {formatCurrency(payout.amount)}
                        </td>
                        <td className="py-4 px-5 text-taupe text-sm">
                          {formatDate(payout.createdAt)}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusPill(payout.status)}`}>
                            {getStatusIcon(payout.status)}
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14">
                <DollarSign className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-taupe">No payouts yet</p>
              </div>
            )}
          </div>
        </main>
      </main>
    </div>
  )
}
