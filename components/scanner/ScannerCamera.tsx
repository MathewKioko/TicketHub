'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, Scan, StopCircle } from 'lucide-react'

interface ScannerCameraProps {
  onScan: (qrData: string) => void
  scanning?: boolean
  disabled?: boolean
}

/**
 * Reusable camera + jsQR QR-decoding component.
 * Streams the device camera to a <video>, draws frames to a canvas every
 * animation frame, and runs jsQR to decode QR codes live.
 */
export function ScannerCamera({ onScan, scanning = false, disabled = false }: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decodedRef = useRef<string | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setActive(false)
  }, [])

  const decodeLoop = useCallback(async () => {
    // Lazy-load jsQR on first use
    let jsQR: any
    try {
      const mod = await import('jsqr')
      jsQR = mod.default
    } catch {
      setError('QR decoding library not installed. Use manual input instead.')
      return
    }

    const processFrame = () => {
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(processFrame)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        rafRef.current = requestAnimationFrame(processFrame)
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code && code.data && code.data !== decodedRef.current) {
        decodedRef.current = code.data
        onScan(code.data)
      }

      rafRef.current = requestAnimationFrame(processFrame)
    }

    rafRef.current = requestAnimationFrame(processFrame)
  }, [onScan])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setActive(true)
        await videoRef.current.play()
        decodeLoop()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera. Grant permission or use manual input.')
    }
  }, [decodeLoop])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // Reset decoded marker when a new scan should be allowed
  useEffect(() => {
    if (!scanning) {
      decodedRef.current = null
    }
  }, [scanning])

  return (
    <div className="space-y-4">
      {!active ? (
        <div className="text-center py-8">
          <div className="relative inline-block mb-5">
            <Camera className="w-24 h-24 text-gold/50 mx-auto" />
            <div className="absolute inset-0 bg-gold/10 rounded-full blur-3xl" />
          </div>
          <p className="text-ivory/70 mb-6">Start the camera to scan QR codes from tickets</p>
          <button
            onClick={startCamera}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx font-semibold hover:shadow-glow-lg transition-all disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </button>
          {error && (
            <p className="mt-4 text-blush bg-blush/10 border border-blush/30 rounded-lg px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-onyx rounded-2xl overflow-hidden border border-gold/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-80 object-cover"
            />
            {/* Scan overlay frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-gold/70 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-gold rounded-br-lg" />
              </div>
            </div>
            {scanning && (
              <div className="absolute inset-0 bg-onyx/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-gold font-display text-2xl font-bold animate-pulse">
                  Processing...
                </div>
              </div>
            )}
          </div>

          <button
            onClick={stopCamera}
            disabled={disabled}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gold/30 text-gold font-semibold hover:bg-gold/10 transition-all disabled:opacity-50"
          >
            <StopCircle className="w-5 h-5" />
            Stop Camera
          </button>
        </div>
      )}
    </div>
  )
}
