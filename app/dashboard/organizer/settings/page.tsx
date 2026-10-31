'use client'

import { useCallback, useEffect, useState } from 'react'
import { FormEvent } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Notice } from '@/components/ui/Notice'
import { Skeleton } from '@/components/ui/Feedback'
import { ORGANIZER_TABS } from '@/lib/site'

interface OwnerProfile {
  paystackBusinessName?: string | null
  paystackSettledBank?: string | null
  paystackAccountNumber?: string | null
  paystackSplitRatio?: number | null
  bankVerified?: boolean | null
  bankVerificationStatus?: string | null
  bankStatementUrl?: string | null
  bankStatementUploadedAt?: string | null
  bankVerificationNote?: string | null
  autoPayout?: boolean | null
  payoutSchedule?: string | null
}

export default function PayoutSettingsPage() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadError, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [splitRatio, setSplitRatio] = useState('10')
  const [autoPayout, setAutoPayout] = useState(true)
  const [payoutSchedule, setPayoutSchedule] = useState('weekly')
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [accountName, setAccountName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/owner/profile', { cache: 'no-store' })
      if (!response.ok) throw new Error('Payout settings could not be loaded.')
      const data = (await response.json()) as { profile?: OwnerProfile | null }
      const next = data.profile ?? null
      setProfile(next)
      if (next) {
        setBusinessName(next.paystackBusinessName ?? '')
        setBankCode(next.paystackSettledBank ?? '')
        setAccountNumber(next.paystackAccountNumber ?? '')
        setSplitRatio(String(next.paystackSplitRatio ?? 10))
        setAutoPayout(Boolean(next.autoPayout))
        setPayoutSchedule(next.payoutSchedule ?? 'weekly')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Payout settings could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          bankCode: bankCode.trim(),
          accountNumber: accountNumber.trim(),
          splitRatio: Number(splitRatio) || 0,
          autoPayout,
          payoutSchedule,
        }),
      })
      const data = (await response.json()) as { error?: string; profile?: OwnerProfile }
      if (!response.ok) throw new Error(data.error ?? 'Those bank details could not be verified.')
      setProfile(data.profile ?? profile)
      setSaveMessage('Payout settings saved. Bank details are pending verification.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Payout settings could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  async function uploadBankStatement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bankStatement) return
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', bankStatement)

      const response = await fetch('/api/organizer/bank-statement/upload', {
        method: 'POST',
        body: formData,
      })
      const data = (await response.json()) as { error?: string; url?: string }
      if (!response.ok) throw new Error(data.error ?? 'Statement upload failed.')

      setSaveMessage('Bank statement uploaded. An administrator will review it.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Statement upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <WorkspaceTabs tabs={ORGANIZER_TABS} context="Organizer workspace" />

      <div className="mx-auto max-w-[880px] px-5 py-9 sm:px-8 lg:py-11">
        <h1 className="display text-[38px] leading-none sm:text-[44px]">Payout settings</h1>
        <p className="mt-2.5 max-w-[62ch] text-sm text-slate">
          Sales settle to this bank account through a Paystack subaccount. TicketHub’s platform fee is
          deducted before settlement.
        </p>

        {loadError ? (
          <Notice tone="danger" className="mt-6" title="Settings could not be loaded">
            {loadError}
          </Notice>
        ) : null}

        {saveMessage ? (
          <Notice tone="success" className="mt-6">
            {saveMessage}
          </Notice>
        ) : null}

        {loading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Bank account
                </h2>
                <span className="text-xs font-medium">
                  {profile?.bankVerified ? 'Verified ✓' : 'Pending verification'}
                </span>
              </div>
              <div className="mt-5 space-y-5">
                <Input
                  label="Business or trading name"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Sauti Collective"
                  required
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input
                    label="Bank code"
                    value={bankCode}
                    onChange={(event) => setBankCode(event.target.value)}
                    hint="Paystack bank code, e.g. 011 for a Kenyan bank."
                    placeholder="011"
                    required
                  />
                  <Input
                    label="Account number"
                    value={accountNumber}
                    onChange={(event) =>
                      setAccountNumber(event.target.value.replace(/[^\d]/g, ''))
                    }
                    inputMode="numeric"
                    placeholder="0123456789"
                    required
                  />
                </div>
                <Input
                  label="Account name (as on bank statement)"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Sauti Collective Ltd"
                  required
                />
              </div>
            </section>

            <section className="border border-line rounded-sm p-5 mt-8">
              <div className="flex items-baseline justify-between border-b border-line pb-2.5 mb-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Bank statement upload
                </h2>
                <span className="text-xs font-medium">
                  {profile?.bankStatementUploadedAt
                    ? 'Uploaded'
                    : 'Not uploaded yet'}
              </span>
              </div>
              <p className="text-sm text-slate mb-4">
                Upload a copy of your bank statement so an administrator can verify your account
                details. You can continue using TicketHub while your documents are under review.
              </p>
              <form onSubmit={uploadBankStatement} className="space-y-4">
                <label className="block text-[12px] font-semibold text-ink mb-2">
                  Bank statement (PDF or image)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setBankStatement(file)
                  }}
                  className="block w-full text-sm text-slate file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ink file:text-bone hover:file:bg-ink-soft"
                />
                {bankStatement && (
                  <p className="text-xs text-slate">
                    Selected: {bankStatement.name}
                  </p>
                )}
                <Button type="submit" disabled={uploading || !bankStatement}>
                  {uploading ? 'Uploading…' : 'Upload bank statement'}
                </Button>
              </form>
            </section>

            <section className="mt-8">
              <div className="border-b border-line pb-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Settlement
                </h2>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Platform fee (%)"
                  inputMode="numeric"
                  value={splitRatio}
                  onChange={(event) =>
                    setSplitRatio(event.target.value.replace(/[^\d.]/g, ''))
                  }
                  hint="Deducted from ticket sales before settlement."
                />
                <Select
                  label="Payout schedule"
                  value={payoutSchedule}
                  onChange={(event) => setPayoutSchedule(event.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every two weeks</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </div>
              <label className="mt-5 flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={autoPayout}
                  onChange={(event) => setAutoPayout(event.target.checked)}
                  className="h-4 w-4 accent-[#16130F]"
                />
                Pay out automatically on this schedule
              </label>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Verifying with Paystack…' : 'Save payout settings'}
              </Button>
              <p className="text-xs text-slate">
                Bank details are checked against Paystack before they are stored.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
