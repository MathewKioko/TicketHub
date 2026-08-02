'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, DollarSign, BarChart3, Wallet, ArrowRight, Check, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  organizerRequestStatus?: string
}

export default function BecomeOrganizerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status === 'pending') {
      // User was redirected after login with PENDING_ORGANIZER role
    }
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)

        if (['ORGANIZER', 'EVENT_OWNER', 'ADMIN'].includes(data.user.role)) {
          router.push('/dashboard/organizer')
        }

        if (data.user.role === 'PENDING_ORGANIZER') {
          setUser({ ...data.user, organizerRequestStatus: 'pending' })
        }
      }
    } catch (error) {
      // User not logged in
    } finally {
      setLoading(false)
    }
  }

  const requestOrganizerAccess = async () => {
    setRequesting(true)
    try {
      const res = await fetch('/api/auth/request-organizer', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        alert('Your request has been submitted. We will review your application shortly.')
      } else {
        alert(data.error || 'Failed to submit request')
      }
    } catch (error) {
      alert('Failed to submit request')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading...</p>
        </div>
      </div>
    )
  }

  const isLoggedIn = !!user
  const isAttendee = user?.role === 'ATTENDEE'
  const isPendingOrganizer = user?.role === 'PENDING_ORGANIZER' || user?.organizerRequestStatus === 'pending'

  return (
    <div className="min-h-screen bg-luxe relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blush/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/30 mb-8">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">Kenya's Premium Event Platform</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-ivory mb-6">
            Host Events on <span className="gradient-text italic">TicketHub</span>
          </h1>

          <p className="text-xl text-taupe mb-10 max-w-2xl mx-auto leading-relaxed">
            Apply for an Organizer account to create and sell tickets for your events.
            Set your own prices, track sales in real-time, and receive payouts directly to your bank account.
          </p>

          {/* Action Buttons */}
          {!isLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup?role=organizer"
                className="px-8 py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-bold text-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Register as Organizer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 glass border border-gold/20 text-ivory rounded-xl font-bold text-lg hover:bg-gold/10 transition-all duration-300"
              >
                Login as Organizer
              </Link>
            </div>
          ) : isAttendee ? (
            <button
              onClick={requestOrganizerAccess}
              disabled={requesting}
              className="px-8 py-4 bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx rounded-xl font-bold text-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {requesting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  Request Organizer Access
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* Pending Status Message */}
        {isPendingOrganizer && (
          <div className="mt-8 glass-luxe border border-gold/30 rounded-xl p-6 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ivory">Request Pending Approval</h3>
                <p className="text-taupe text-sm">Your organizer request is being reviewed</p>
              </div>
            </div>
            <p className="text-ivory/70 text-sm mb-4">
              We have received your request to become an organizer. Our team will review your application
              and approve it shortly. You will receive an email once your request has been approved.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/attendee"
                className="px-4 py-2 glass border border-gold/20 text-ivory rounded-lg text-sm hover:bg-gold/10"
              >
                Go to Dashboard
              </Link>
              <button className="px-4 py-2 text-gold text-sm hover:underline">
                Contact Support
              </button>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-20">
          <h2 className="font-display text-3xl font-bold text-ivory text-center mb-12">
            Why Host with <span className="gradient-text italic">TicketHub</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<DollarSign className="w-10 h-10" />}
              title="Set Your Own Prices"
              description="You decide how much to charge for tickets. Keep more of what you earn with our competitive platform fees."
              color="text-gold"
            />
            <BenefitCard
              icon={<BarChart3 className="w-10 h-10" />}
              title="Real-time Analytics"
              description="Track ticket sales, revenue, and attendance as it happens. Make data-driven decisions for your events."
              color="text-gold-light"
            />
            <BenefitCard
              icon={<Wallet className="w-10 h-10" />}
              title="Fast Payouts in KES"
              description="Receive payments directly to your Kenyan bank account. Fast, secure, and reliable Paystack payouts."
              color="text-gold-dark"
            />
          </div>
        </div>

        {/* Features List */}
        <div className="mt-20 glass-luxe rounded-2xl p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold text-ivory text-center mb-8">
            Everything You Need to Succeed
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Custom event pages with your branding',
              'Multiple ticket tiers (VIP, Regular, etc.)',
              'QR code scanning for entry',
              'Email notifications to attendees',
              'Attendee management and export',
              'Social media sharing tools',
              'Event discovery on TicketHub',
              '24/7 support from our team'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-ivory/70">
                <Check className="w-5 h-5 text-gold flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-taupe mb-4">
            Ready to take your events to the next level?
          </p>
          {!isLoggedIn ? (
            <Link
              href="/auth/signup?role=organizer"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-semibold"
            >
              Get Started Today <ArrowRight className="w-5 h-5" />
            </Link>
          ) : isAttendee ? (
            <button
              onClick={requestOrganizerAccess}
              disabled={requesting}
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-semibold disabled:opacity-50"
            >
              {requesting ? 'Submitting...' : 'Request Access Now'} <ArrowRight className="w-5 h-5" />
            </button>
          ) : isPendingOrganizer ? (
            <p className="text-gold/80">
              Please wait while we review your request
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="glass-dark rounded-2xl p-8 hover:scale-105 transition-all duration-300 card-hover border border-gold/10">
      <div className={`${color} mb-6`}>
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-ivory mb-3">{title}</h3>
      <p className="text-taupe leading-relaxed">{description}</p>
    </div>
  )
}

