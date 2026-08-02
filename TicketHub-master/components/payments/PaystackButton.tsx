'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaystackButtonProps {
  ticketIds: string[]
  onSuccess?: () => void
  onError?: (error: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export function PaystackButton({
  ticketIds,
  onSuccess,
  onError,
  disabled = false,
  children,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (ticketIds.length === 0) {
      toast.error('No tickets selected')
      return
    }

    setLoading(true)

    try {
      // Call our checkout endpoint
      const response = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack authorization URL
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      const errorMessage = error.message || 'Payment failed'
      toast.error(errorMessage)
      onError?.(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || ticketIds.length === 0}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || 'Pay with Paystack'}
        </>
      )}
    </Button>
  )
}

// Hook for Paystack payment flow
export function usePaystackPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializePayment = async (ticketIds: string[]) => {
    if (ticketIds.length === 0) {
      setError('No tickets selected')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Payment initialization failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const redirectToPayment = (authorizationUrl: string) => {
    window.location.href = authorizationUrl
  }

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/paystack/verify/${reference}`)
      const data = await response.json()
      return data
    } catch (err: any) {
      console.error('Verification error:', err)
      return null
    }
  }

  return {
    loading,
    error,
    initializePayment,
    redirectToPayment,
    verifyPayment,
  }
}
