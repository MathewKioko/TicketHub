'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Notice } from '@/components/ui/Notice'
import { FocusedHeader } from '@/components/layout/FocusedHeader'

const onboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(8, 'Account number is required'),
  bankCode: z.string().min(2, 'Bank code is required'),
  splitPercentage: z.string().min(1, 'Platform fee is required'),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [bankStatement, setBankStatement] = useState<File | null>(null)

  useEffect(() => {
    void fetch('/api/paystack/banks', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: any) => {
        if (data.status && Array.isArray(data.data)) {
          setBanks(
            data.data
              .filter((b: any) => b.supports_transfer && b.active)
              .map((b: any) => ({ name: b.name, code: b.code }))
          )
        }
      })
      .catch(() => {
        // Banks optional; user can type bank code manually
      })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
  })

  async function onSubmit(data: OnboardingForm) {
    setError(null)
    try {
      const response = await fetch('/api/organizer/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.businessName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          splitPercentage: parseInt(data.splitPercentage, 10),
        }),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error ?? 'Failed to create subaccount')

      // Upload bank statement if provided
      if (bankStatement) {
        const formData = new FormData()
        formData.append('file', bankStatement)
        const uploadResponse = await fetch('/api/organizer/bank-statement/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          throw new Error(uploadResult.error ?? 'Bank statement upload failed')
        }
      }

      setDone(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create subaccount')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBankStatementChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg']
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, PNG, or JPG files are allowed')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be under 10MB')
        return
      }
      setBankStatement(file)
      setError(null)
    }
  }

  if (done) {
    return (
      <>
        <FocusedHeader rightLabel="Organizer workspace" rightHref="/dashboard/organizer" />
        <div className="mx-auto max-w-[440px] px-5 py-10 sm:px-8 lg:py-14">
        <h1 className="display text-[40px] leading-tight">Almost ready</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Your payout account has been created. An administrator will review your bank details and
          {bankStatement ? 'document' : 'documents'} before payouts are enabled.
        </p>
        <Notice tone="success" className="mt-6" title="Subaccount created">
          Your revenue split and bank details are on file. {bankStatement ? 'Your document has been uploaded for verification.' : 'Upload your ID or bank statement in settings to enable payouts.'}
        </Notice>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => void router.push('/dashboard/organizer')}
              className="w-full sm:w-auto"
            >
              Open organizer workspace
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
      </>
    )
  }

  return (
    <>
      <FocusedHeader rightLabel="Organizer workspace" rightHref="/dashboard/organizer" />
      <div className="mx-auto max-w-[440px] px-5 py-10 sm:px-8 lg:py-14">
        <h1 className="display text-[40px] leading-tight">Set up payouts</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Tell us where to send your earnings. TicketHub keeps a platform fee on every ticket sold;
          the rest is paid out to your bank account through Paystack.
        </p>

        {error ? (
          <Notice tone="danger" className="mt-6">{error}</Notice>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <Input
            label="Business / organization name"
            placeholder="e.g. Mathew Events Ltd"
            {...register('businessName')}
            error={errors.businessName?.message}
          />
          {errors.businessName && (
            <p id="businessName-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
              {errors.businessName.message}
            </p>
          )}

          <Input
            label="Account name (as on bank account)"
            placeholder="e.g. MATHEW EVENTS LTD"
            {...register('accountName')}
            error={errors.accountName?.message}
          />
          {errors.accountName && (
            <p id="accountName-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
              {errors.accountName.message}
            </p>
          )}

          <Input
            label="Account number"
            type="tel"
            placeholder="e.g. 0123456789"
            {...register('accountNumber')}
            error={errors.accountNumber?.message}
          />
          {errors.accountNumber && (
            <p id="accountNumber-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
              {errors.accountNumber.message}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">
              Bank
            </label>
            <Select
              {...register('bankCode')}
              defaultValue=""
              error={errors.bankCode?.message}
            >
              <option value="">Select bank…</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
            <Input
              label="Bank code (optional override)"
              placeholder="e.g. 044"
              {...register('bankCode')}
              error={errors.bankCode?.message}
            />
          </div>
          {errors.bankCode && (
            <p id="bankCode-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
              {errors.bankCode.message}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">
              TicketHub platform fee
            </label>
            <Select
              {...register('splitPercentage')}
              defaultValue="10"
            >
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
            </Select>
          </div>
          <p className="text-xs text-slate mt-1.5">
            TicketHub keeps this percentage of every ticket sale. The rest is paid to your bank
            account.
          </p>

          <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? 'Creating account…' : 'Create payout account'}
          </Button>

          {bankStatement && (
            <p className="mt-3 text-xs text-slate">
              Selected: {bankStatement.name} ({Math.round(bankStatement.size / 1024)} KB)
            </p>
          )}
          <label className="block text-[12px] font-semibold text-slate mb-2">
            Bank statement (ID or statement copy)
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleBankStatementChange}
            className="block w-full text-sm text-slate file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ink file:text-bone hover:file:bg-ink-soft"
          />
          <p className="text-xs text-slate mt-1">
            Upload a copy of your ID or bank statement for verification. An administrator will review
            it before payouts are enabled.
          </p>
        </form>

        <p className="mt-6 text-[13px] text-slate">
          Already set up?{' '}
          <Link href="/dashboard/organizer" className="link-quiet text-ink">
            Open organizer workspace
          </Link>
          .
        </p>
      </div>
      <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
    </>
  )
}
