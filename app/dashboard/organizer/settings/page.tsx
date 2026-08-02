'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Settings, Sparkles, User, Mail, Phone, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
  name: string
  email: string
  phone: string
  bio?: string
}

export default function OrganizerSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setProfile({
          name: data.user?.name || '',
          email: data.user?.email || '',
          phone: data.user?.phone || '',
          bio: data.user?.bio || '',
        })
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        toast.success('Profile updated successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-onyx flex">
      <DashboardSidebar role="organizer" />

      <main className="flex-1 min-w-0 bg-luxe">
        <header className="glass-dark border-b border-gold/10">
          <div className="px-6 md:px-10 py-8">
            <div className="animate-fade-in-up">
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Configuration</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
                Organizer <span className="gradient-text italic">Settings</span>
              </h1>
              <p className="text-taupe mt-1">Manage your profile and preferences</p>
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 py-8 max-w-3xl">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Profile Section */}
            <div className="luxe-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-light to-gold flex items-center justify-center">
                  <User className="w-6 h-6 text-onyx" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-ivory">Profile Information</h2>
                  <p className="text-sm text-taupe">Update your personal details</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ivory/70 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory/70 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ivory/70 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/50" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ivory/70 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3.5 bg-coal/70 border border-white/10 rounded-xl text-ivory placeholder-taupe/50 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-semibold hover:shadow-glow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-onyx/30 border-t-onyx rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </main>
    </div>
  )
}
