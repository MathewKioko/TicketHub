'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Users, Search, Shield, BadgeCheck, XCircle, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  organizerRequestStatus?: string
  _count: {
    tickets: number
    events: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSetAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to make this user an admin?')) return

    try {
      const res = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        toast.success('User promoted to admin')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to set admin')
      }
    } catch (error) {
      toast.error('Failed to set admin')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRolePill = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'pill-gold'
      case 'ORGANIZER':
      case 'EVENT_OWNER':
        return 'pill-green'
      case 'PENDING_ORGANIZER':
        return 'pill-amber'
      default:
        return 'pill-muted'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roles = [...new Set(users.map(u => u.role))]

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading users...</p>
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
            onClick={fetchUsers}
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
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Administration</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                User <span className="gradient-text italic">Directory</span>
              </h1>
              <p className="text-taupe mt-1">{users.length} registered users</p>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-coal/70 border border-white/10 rounded-xl text-ivory focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div className="luxe-card rounded-2xl overflow-hidden">
            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">
                        <span className="flex items-center gap-1">
                          User
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </span>
                      </th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Email</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Role</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Tickets</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Events</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Joined</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-taupe">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-gold/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/20 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gold-light">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-ivory">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-taupe text-sm">{user.email}</td>
                        <td className="py-4 px-5">
                          <span className={`pill ${getRolePill(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-ivory">{user._count.tickets}</td>
                        <td className="py-4 px-5 text-ivory">{user._count.events}</td>
                        <td className="py-4 px-5 text-taupe text-sm">{formatDate(user.createdAt)}</td>
                        <td className="py-4 px-5">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleSetAdmin(user.id)}
                              className="flex items-center gap-1.5 text-gold hover:text-gold-light text-sm font-medium transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              Set Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14">
                <Users className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-taupe">No users found</p>
              </div>
            )}
          </div>
        </main>
      </main>
    </div>
  )
}
