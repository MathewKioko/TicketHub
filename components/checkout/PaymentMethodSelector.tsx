'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { isMpesaConfigured } from '@/lib/mpesa'
import { formatMoney } from '@/lib/format'

export function PaymentMethodSelector({
  totalAmount,
  selectedMethod,
  submitting,
  onSelect,
}: {
  totalAmount: number
  selectedMethod: 'paystack' | 'mpesa' | null
  submitting: boolean
  onSelect: (method: 'paystack' | 'mpesa', phoneNumber?: string) => void
}) {
  const [phoneNumber, setPhoneNumber] = useState('')

  // Normalize: keep only digits (spaces, +, dashes and other formatting are ignored).
  const normalizedNumber = phoneNumber.replace(/\D/g, '')

  // Kenyan mobile numbers are 12 digits: 254 + 9 digits (starting with 7).
  const phoneValid = /^254\d{9}$/.test(normalizedNumber)

  const isMpesaSelected = selectedMethod === 'mpesa'

  return (
    <RadioGroup
      value={selectedMethod ?? undefined}
      onValueChange={(value) => onSelect(value as 'paystack' | 'mpesa')}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <RadioGroupItem value="paystack" />
          <div className="flex-1">
            <span className="font-medium">Paystack</span>
            <span className="text-xs text-muted-foreground">Card payment — secure global network</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <RadioGroupItem value="mpesa" />
          <div className="flex-1">
            <span className="font-medium">M-Pesa</span>
            <span className="text-xs text-muted-foreground">Lipa na M-Pesa (Safaricom)</span>
          </div>
        </label>

        {isMpesaSelected && (
          <div className="space-y-2">
            <Input
              label="Phone number"
              placeholder="2547XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              hint="Enter your Safaricom mobile number (e.g., 254712345678)"
              error={phoneValid ? undefined : 'Invalid phone number format'}
            />
          </div>
        )}
      </div>

      {selectedMethod && (
        <Button
          onClick={() => onSelect(selectedMethod, isMpesaSelected ? phoneNumber : undefined)}
          className="w-full"
          disabled={
            selectedMethod === 'mpesa'
              ? (!normalizedNumber || !phoneValid || submitting)
              : submitting
          }
          aria-busy={submitting}
        >
          {selectedMethod === 'mpesa'
            ? `Pay KES ${formatMoney(totalAmount)} with M-Pesa`
            : 'Continue with Paystack →'}
        </Button>
      )}
    </RadioGroup>
  )
}