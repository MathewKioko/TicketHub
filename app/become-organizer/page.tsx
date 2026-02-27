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
}

export default function BecomeOrganizerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        
        // If already an organizer or admin, redirect
        if (['ORGANIZER', 'EVENT_OWNER', 'ADMIN'].includes(data.user.role)) {
          router.push('/dashboard/organizer')
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
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-kenyan-green/30 border-t-kenyan-green rounded-full animate-spin" />
          <p className="text-kenyan-cream/60">Loading...</p>
        </div>
      </div>
    )
  }

  const isLoggedIn = !!user
  const isAttendee = user?.role === 'ATTENDEE'

  return (
    <div className="min-h-screen bg-mesh">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-kenyan-green to-kenyan-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text font-bold">TicketHub</span>
          </Link>
          <div className="flex gap-4">
            {!isLoggedIn ? (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-kenyan-cream/80 hover:text-white">
                  Login
                </Link>
                <Link href="/auth/signup" className="px-5 py-2.5 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white rounded-lg font-semibold">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/dashboard/attendee" className="px-4 py-2 text-kenyan-cream/80 hover:text-white">
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-kenyan-gold/30 mb-8">
            <Sparkles className="w-4 h-4 text-kenyan-gold" />
            <span className="text-sm text-kenyan-gold font-medium">Join Kenya's Event Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Host Events on <span className="gradient-text">TicketHub</span>
          </h1>
          
          <p className="text-xl text-kenyan-cream/70 mb-10 max-w-2xl mx-auto">
            Apply for an Organizer account to create and sell tickets for your events. 
            Set your own prices, track sales in real-time, and receive payouts directly to your bank account.
          </p>

          {/* Action Buttons */}
          {!isLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup?role=organizer"
                className="px-8 py-4 bg-gradient-to-r from-kenyan-green to-kenyan-accent text-white rounded-xl font-bold text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Register as Organizer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 glass border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Login as Organizer
              </Link>
            </div>
          ) : isAttendee ? (
            <button
              onClick={requestOrganizerAccess}
              disabled={requesting}
              className="px-8 py-4 bg-gradient-to-r from-kenyan-gold to-yellow-400 text-kenyan-black rounded-xl font-bold text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
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

        {/* Benefits */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Host with <span className="gradient-text">TicketHub</span>?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<DollarSign className="w-10 h-10" />}
              title="Set Your Own Prices"
              description="You decide how much to charge for tickets. Keep more of what you earn with our competitive platform fees."
              color="kenyan-green"
            />
            <BenefitCard
              icon={<BarChart3 className="w-10 h-10" />}
              title="Real-time Analytics"
              description="Track ticket sales, revenue, and attendance as it happens. Make data-driven decisions for your events."
              color="kenyan-gold"
            />
            <BenefitCard
              icon={<Wallet className="w-10 h-10" />}
              title="Fast Payouts in KES"
              description="Receive payments directly to your Kenyan bank account. Fast, secure, and reliable Paystack payouts."
              color="kenyan-red"
            />
          </div>
        </div>

        {/* Features List */}
        <div className="mt-20 glass rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
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
              <div key={i} className="flex items-center gap-3 text-kenyan-cream/80">
                <Check className="w-5 h-5 text-kenyan-green flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-kenyan-cream/60 mb-4">
            Ready to take your events to the next level?
          </p>
          {!isLoggedIn ? (
            <Link
              href="/auth/signup?role=organizer"
              className="inline-flex items-center gap-2 text-kenyan-gold hover:text-kenyan-cream font-semibold"
            >
              Get Started Today <ArrowRight className="w-5 h-5" />
            </Link>
          ) : isAttendee ? (
            <button
              onClick={requestOrganizerAccess}
              disabled={requesting}
              className="inline-flex items-center gap-2 text-kenyan-gold hover:text-kenyan-cream font-semibold disabled:opacity-50"
            >
              {requesting ? 'Submitting...' : 'Request Access Now'} <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  const colorClasses: Record<string, string> = {
    'kenyan-green': 'text-kenyan-green',
    'kenyan-gold': 'text-kenyan-gold',
    'kenyan-red': 'text-kenyan-red',
  }

  return (
    <div className="glass-dark rounded-2xl p-8 hover:scale-105 transition-all duration-300 card-hover">
      <div className={`${colorClasses[color]} mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-kenyan-cream/70 leading-relaxed">{description}</p>
    </div>
  )
}
