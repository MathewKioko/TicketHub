'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Scan, Keyboard, ScanLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { ScannerCamera } from '@/components/scanner/ScannerCamera'

interface ScanEvent {
  id: string
  title: string
  date: string
}

interface ScanResult {
  success: boolean
  verdict?: string
  message?: string
  ticket?: {
    id: string
    status: string
    checkedInAt?: string
    user: {
      name: string
      email: string
    }
    event: {
      id: string
      title: string
      date: string
      venue: string
    }
  }
  error?: string
}

export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-taupe">Loading scanner...</p>
        </div>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  )
}

function ScannerContent() {
  const searchParams = useSearchParams()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [events, setEvents] = useState<ScanEvent[]>([])
  const [eventId, setEventId] = useState(searchParams.get('eventId') || '')
  const [manualInput, setManualInput] = useState('')
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchEvents()
    return () => {
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?organizerId=me')
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }, [])

  const handleScan = useCallback(async (qrData: string) => {
    if (!qrData || scanning) return

    setScanning(true)
    setResult(null)

    try {
      const res = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData: qrData, eventId: eventId || undefined }),
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setResult({
          success: true,
          verdict: data.verdict,
          message: data.message,
          ticket: data.ticket,
        })
        toast.success('Check-in successful!')
      } else {
        setResult({
          success: false,
          verdict: data.verdict,
          message: data.message || data.error,
          ticket: data.ticket,
          error: data.error,
        })
        toast.error(data.message || data.error || 'Scan failed')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setResult({
        success: false,
        message: 'Failed to process scan',
      })
      toast.error('Failed to process scan')
    } finally {
      setScanning(false)
      // Auto-clear result after 6s so the next scan is ready
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current)
      resultTimeoutRef.current = setTimeout(() => setResult(null), 6000)
    }
  }, [scanning, eventId])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      handleScan(manualInput.trim())
      setManualInput('')
    }
  }

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return 'gold'
    switch (verdict) {
      case 'VALID': return 'emerald'
      case 'ALREADY_USED': return 'amber'
      case 'WRONG_EVENT': return 'amber'
      case 'EXPIRED': return 'amber'
      case 'CANCELLED': return 'red'
      case 'REFUNDED': return 'red'
      case 'NOT_CONFIRMED': return 'amber'
      case 'NOT_FOUND': return 'red'
      case 'INVALID_FORMAT': return 'red'
      default: return 'gold'
    }
  }

  return (
    <div className="min-h-screen bg-luxe">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center shadow-glow">
              <ScanLine className="w-8 h-8 text-onyx" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ivory mb-3">
              Ticket <span className="gradient-text italic">Scanner</span>
            </h1>
            <p className="text-taupe text-lg">Validate and check in attendees</p>
          </div>

          <Card variant="elevated" className="animate-scale-in premium-border shine">
            {/* Event Picker */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ivory/80 mb-2">
                Scanning for Event
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-onyx/60 border border-gold/20 text-ivory focus:border-gold/50 focus:outline-none transition-all"
              >
                <option value="">All my events (no filter)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} — {new Date(ev.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-taupe mt-2">
                Select a specific event to prevent tickets from other events being accepted.
              </p>
            </div>

            <div className="divider-gold mb-6" />

            {/* Camera scanner */}
            <ScannerCamera onScan={handleScan} scanning={scanning} disabled={scanning} />

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs uppercase tracking-widest text-taupe">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Manual input */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste QR code data here..."
                  className="flex-1 px-4 py-3 rounded-xl bg-onyx/60 border border-gold/20 text-ivory placeholder-ivory/30 focus:border-gold/50 focus:outline-none transition-all"
                />
                <Button variant="gold" type="submit" disabled={scanning || !manualInput.trim()}>
                  <Keyboard className="w-4 h-4 mr-2" />
                  Check
                </Button>
              </div>
            </form>
          </Card>

          {/* Scan Result */}
          {result && (
            <div
              className={`mt-6 p-6 rounded-2xl border-2 animate-fade-in ${
                result.success
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-blush/10 border-blush/40'
              }`}
            >
              {result.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <CheckCircle className="w-9 h-9" />
                    <div>
                      <div className="font-display font-bold text-xl text-emerald-300">
                        {result.message || 'Check-in Successful'}
                      </div>
                      {result.verdict && (
                        <span className="text-xs uppercase tracking-widest text-emerald-400/70">
                          {result.verdict}
                        </span>
                      )}
                    </div>
                  </div>
                  {result.ticket && (
                    <div className="space-y-2 text-sm text-ivory/80">
                      <div>
                        <span className="text-gold font-semibold">Event:</span>{' '}
                        {result.ticket.event.title}
                      </div>
                      <div>
                        <span className="text-gold font-semibold">Venue:</span>{' '}
                        {result.ticket.event.venue}
                      </div>
                      <div>
                        <span className="text-gold font-semibold">Attendee:</span>{' '}
                        {result.ticket.user.name} ({result.ticket.user.email})
                      </div>
                      <div>
                        <span className="text-gold font-semibold">Date:</span>{' '}
                        {new Date(result.ticket.event.date).toLocaleString()}
                      </div>
                      {result.ticket.checkedInAt && (
                        <div className="text-emerald-400">
                          ✓ Checked in at {new Date(result.ticket.checkedInAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blush">
                    <XCircle className="w-9 h-9" />
                    <div>
                      <div className="font-display font-bold text-xl text-blush">
                        {result.message || result.error || 'Scan Failed'}
                      </div>
                      {result.verdict && (
                        <span className="text-xs uppercase tracking-widest text-blush/70">
                          {result.verdict}
                        </span>
                      )}
                    </div>
                  </div>
                  {result.ticket && (
                    <div className="text-sm text-ivory/70 space-y-1">
                      <div>
                        <span className="text-gold font-semibold">Event:</span>{' '}
                        {result.ticket.event.title}
                      </div>
                      <div>
                        <span className="text-gold font-semibold">Attendee:</span>{' '}
                        {result.ticket.user.name}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* How to scan */}
          <div className="mt-6 p-5 bg-gold/5 border border-gold/20 rounded-xl">
            <p className="text-sm text-gold font-medium mb-2">
              <strong>Tips:</strong>
            </p>
            <ul className="text-sm text-ivory/60 space-y-1.5 list-disc list-inside">
              <li>Select the event to enforce event-scoped validation.</li>
              <li>A ticket can only be checked in once — re-scans are rejected.</li>
              <li>Unpaid (pending) tickets are rejected at the gate.</li>
              <li>Use manual input if the camera is unavailable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
