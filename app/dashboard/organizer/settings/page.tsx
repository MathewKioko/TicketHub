'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OwnerProfile {
  id: string
  userId: string
  paystackSubaccountId: string | null
  paystackBusinessName: string | null
  paystackSettledBank: string | null
  paystackAccountNumber: string | null
  paystackSplitRatio: number
  bankVerified: boolean
  autoPayout: boolean
  payoutSchedule: string | null
  totalRevenue: number
  totalPayouts: number
  pendingPayouts: number
}

export default function OrganizerSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    splitRatio: 10,
    autoPayout: false,
    payoutSchedule: 'weekly',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/owner/profile')
      if (response.status === 401 || response.status === 403) {
        router.push('/auth/login')
        return
      }
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)
        setFormData({
          businessName: data.profile.paystackBusinessName || '',
          bankCode: data.profile.paystackSettledBank || '',
          accountNumber: data.profile.paystackAccountNumber || '',
          accountName: '',
          splitRatio: data.profile.paystackSplitRatio || 10,
          autoPayout: data.profile.autoPayout || false,
          payoutSchedule: data.profile.payoutSchedule || 'weekly',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Payout settings saved successfully!')
        if (data.profile) {
          setProfile(data.profile)
        }
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/organizer" className="text-2xl font-bold text-indigo-600">
                TicketHub
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Payout Settings
              </span>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard/organizer" className="text-gray-700 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/dashboard/organizer/settings" className="text-indigo-600 font-medium">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {profile && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(profile.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Payouts</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(profile.totalPayouts)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(profile.pendingPayouts)}</p>
            </div>
          </div>
        )}

        {/* Payout Settings Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payout Settings</h2>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Your business name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code
                </label>
                <input
                  type="text"
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 058"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Account number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee Percentage
              </label>
              <input
                type="number"
                value={formData.splitRatio}
                onChange={(e) => setFormData({ ...formData, splitRatio: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
                max="100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Percentage that goes to the platform (rest goes to your subaccount)
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoPayout"
                checked={formData.autoPayout}
                onChange={(e) => setFormData({ ...formData, autoPayout: e.target.checked })}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="autoPayout" className="ml-2 text-sm text-gray-700">
                Enable automatic payouts
              </label>
            </div>

            {formData.autoPayout && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Schedule
                </label>
                <select
                  value={formData.payoutSchedule}
                  onChange={(e) => setFormData({ ...formData, payoutSchedule: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Payout Settings'}
            </button>
          </form>
        </div>

        {/* Bank Verification Status */}
        {profile && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="flex items-center">
              {profile.bankVerified ? (
                <>
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-green-700">Bank account verified</span>
                </>
              ) : (
                <>
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <span className="text-yellow-700">Bank account not verified</span>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
