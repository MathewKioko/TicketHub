'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { XCircle, ArrowLeft, Ticket, Sparkles } from 'lucide-react'

export default function TicketCancelPage() {
  return (
    <div className="min-h-screen bg-luxe flex items-center justify-center p-4">
      <div className="container mx-auto px-4 py-12">
        <Card variant="elevated" className="max-w-2xl mx-auto text-center animate-scale-in-bounce premium-border shine">
          <div className="mb-8 animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <XCircle className="w-28 h-28 text-blush mx-auto animate-scale-in-bounce" />
              <div className="absolute inset-0 bg-blush/20 rounded-full blur-3xl animate-pulse-soft" />
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-ivory mb-4 text-shadow-lg">
              Payment <span className="gradient-text-red italic">Cancelled</span>
            </h1>
            <p className="text-xl text-taupe">
              Your payment was cancelled. No charges were made to your account.
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/events">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </Link>
            <Link href="/dashboard/attendee">
              <Button variant="gold">
                <Ticket className="w-4 h-4 mr-2" />
                My Tickets
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

