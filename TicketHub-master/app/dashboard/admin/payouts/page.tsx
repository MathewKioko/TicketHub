'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  processedAt: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
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
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                Payout Management
              </span>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard/admin" className="text-gray-700 hover:text-indigo-600">
                Overview
              </Link>
              <Link href="/dashboard/admin/users" className="text-gray-700 hover:text-indigo-600">
                Users
              </Link>
              <Link href="/dashboard/admin/payouts" className="text-indigo-600 font-medium">
                Payouts
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Payouts</h3>
          </div>
          
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Payout ID</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Bank Details</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payouts.length > 0 ? (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="text-sm font-mono text-gray-500">{payout.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {payout.accountName && (
                        <div>
                          <p>{payout.accountName}</p>
                          <p className="text-sm">{payout.bankName} - {payout.accountNumber}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        payout.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {formatDate(payout.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No payouts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
