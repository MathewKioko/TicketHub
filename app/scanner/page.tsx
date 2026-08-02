'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Camera, Scan, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScanResult {
  success: boolean
  ticket?: {
    id: string
    event: {
      title: string
      date: string
    }
    user: {
      name: string
      email: string
    }
    status: string
    checkedInAt?: string
  }
  error?: string
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraReady(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Failed to access camera. Please grant camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
    setScanning(false)
  }

  const handleScan = async (qrData: string) => {
    setScanning(true)
    setResult(null)

    try {
      const res = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData: qrData }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          ticket: data.ticket,
        })
        toast.success('Ticket checked in successfully!')
      } else {
        setResult({
          success: false,
          error: data.error || 'Scan failed',
        })
        toast.error(data.error || 'Invalid ticket')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setResult({
        success: false,
        error: 'Failed to process scan',
      })
      toast.error('Failed to process scan')
    } finally {
      setScanning(false)
    }
  }

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data:')
    if (qrData) {
      handleScan(qrData)
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !cameraReady) return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context || !videoRef.current.videoWidth) return

    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    toast('QR scanning requires a library. Use manual input for now.')
  }

  return (
    <div className="min-h-screen bg-luxe">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center shadow-glow">
              <Scan className="w-8 h-8 text-onyx" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ivory mb-3">
              Ticket <span className="gradient-text italic">Scanner</span>
            </h1>
            <p className="text-taupe text-lg">Scan QR codes to check in attendees</p>
          </div>

          <Card variant="elevated" className="animate-scale-in-bounce premium-border shine">
            {!cameraReady ? (
              <div className="text-center py-8 animate-fade-in-up">
                <div className="relative inline-block mb-6">
                  <Camera className="w-32 h-32 text-gold/60 mx-auto" />
                  <div className="absolute inset-0 bg-gold/10 rounded-full blur-3xl" />
                </div>
                <p className="text-lg text-ivory/70 mb-8">
                  Start camera to scan QR codes from tickets
                </p>
                <div className="space-y-3">
                  <Button variant="gold" onClick={startCamera} size="lg" className="w-full sm:w-auto">
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </Button>
                  <div>
                    <Button variant="outline" onClick={handleManualInput} size="lg">
                      Enter QR Code Manually
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div className="relative bg-onyx rounded-2xl overflow-hidden shadow-2xl border border-gold/20">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-gold border-dashed rounded-2xl pointer-events-none animate-pulse" />
                  {scanning && (
                    <div className="absolute inset-0 bg-onyx/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-gold font-display text-2xl font-bold animate-pulse">Scanning...</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="gold"
                    onClick={scanQRCode}
                    disabled={scanning}
                    className="flex-1"
                  >
                    <Scan className="w-5 h-5 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                    disabled={scanning}
                  >
                    Stop Camera
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleManualInput}
                  className="w-full"
                >
                  Or Enter QR Code Manually
                </Button>
              </div>
            )}

            {result && (
              <div className={`mt-6 p-6 rounded-xl border-2 animate-fade-in-up ${
                result.success
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-blush/10 border-blush/30'
              }`}>
                {result.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-300">
                      <CheckCircle className="w-8 h-8" />
                      <span className="font-display font-bold text-xl">Check-in Successful</span>
                    </div>
                    {result.ticket && (
                      <div className="space-y-2 text-sm text-ivory/70">
                        <div>
                          <span className="font-semibold text-gold">Event:</span>{' '}
                          {result.ticket.event.title}
                        </div>
                        <div>
                          <span className="font-semibold text-gold">Attendee:</span>{' '}
                          {result.ticket.user.name} ({result.ticket.user.email})
                        </div>
                        <div>
                          <span className="font-semibold text-gold">Date:</span>{' '}
                          {new Date(result.ticket.event.date).toLocaleString()}
                        </div>
                        {result.ticket.checkedInAt && (
                          <div className="text-taupe">
                            Checked in at:{' '}
                            {new Date(result.ticket.checkedInAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-blush">
                    <XCircle className="w-8 h-8" />
                    <span className="font-display font-bold text-xl">{result.error || 'Scan failed'}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-5 bg-gold/5 border border-gold/20 rounded-xl">
              <p className="text-sm text-gold-light font-medium mb-2">
                <strong>How to scan:</strong>
              </p>
              <ol className="text-sm text-ivory/60 space-y-1 list-decimal list-inside ml-2">
                <li>Open Google Lens or any QR scanner</li>
                <li>Point it at the QR code on the ticket</li>
                <li>If it shows a code starting with "690-" or similar, that's your ticket code!</li>
                <li>Copy that code and paste it here using "Enter QR Code Manually"</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

