'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Skeleton } from '@/components/ui/Feedback'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { formatDateTime } from '@/lib/format'
import { ADMIN_TABS } from '@/lib/site'

interface BankVerificationProfile {
  id: string
  userId: string
  paystackBusinessName?: string | null
  paystackSettledBank?: string | null
  paystackAccountNumber?: string | null
  bankVerified?: boolean | null
  bankVerificationStatus?: string | null
  bankStatementUrl?: string | null
  bankStatementUploadedAt?: string | null
  bankVerificationNote?: string | null
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
  }
}

export default function AdminBankVerificationPage() {
  const [profiles, setProfiles] = useState<BankVerificationProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/bank-verification?status=PENDING', {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Could not load bank verification requests.')
      const data = (await response.json()) as {
        profiles?: BankVerificationProfile[]
      }
      setProfiles(data.profiles ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load verification requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function review(
    userId: string,
    status: 'VERIFIED' | 'REJECTED',
    note?: string
  ) {
    setSubmitting(userId)
    try {
      const response = await fetch(
        `/api/admin/bank-verification/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, note }),
        }
      )
      const data = (await response.json()) as { error?: string; message?: string; profile?: any }
      if (!response.ok) throw new Error(data.error ?? 'Review failed.')
      setMessage(
        status === 'VERIFIED'
          ? `Bank statement verified for ${data.profile?.user?.name ?? 'organizer'}.`
          : `Bank statement rejected for ${data.profile?.user?.name ?? 'organizer'}.`
      )
      void load()
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Review failed.'
      )
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[44px]">Bank verification</h1>
          <p className="mt-2.5 max-w-[62ch] text-sm text-slate">
            Review organizer bank statements before approving payouts.
          </p>
        </div>

        {error ? (
          <Notice tone="danger" className="mt-6" title="Unable to load requests">
            {error}
          </Notice>
        ) : null}

        {message ? (
          <Notice tone="success" className="mt-6">{message}</Notice>
        ) : null}

        {loading ? (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="mt-12 text-center">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
              No pending verifications
            </h2>
            <p className="mt-2 text-sm text-slate">
              All bank statements have been reviewed.
            </p>
          </div>
        ) : (
          <section className="mt-8">
            <Table className="min-w-full">
              <THead>
                <tr>
                  <Th>Organizer</Th>
                  <Th>Bank</Th>
                  <Th>Account</Th>
                  <Th>Statement uploaded</Th>
                  <Th>Actions</Th>
                </tr>
              </THead>
              <TBody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-line">
                    <Td className="pr-2">
                      <p className="text-sm">{profile.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate">{profile.user?.email}</p>
                    </Td>
                    <Td className="pr-2">
                      <p className="text-sm">{profile.paystackBusinessName ?? '—'}</p>
                      <p className="text-xs text-slate">{profile.paystackSettledBank ?? '—'}</p>
                    </Td>
                    <Td className="pr-2">
                      <p className="text-sm">{profile.paystackAccountNumber ?? '—'}</p>
                    </Td>
                    <Td className="pr-2">
                      <p className="text-sm">
                        {formatDateTime(profile.bankStatementUploadedAt)}
                      </p>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={submitting === profile.id}
                          onClick={() => void review(profile.id, 'VERIFIED')}
                        >
                          {submitting === profile.id ? 'Verifying…' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={submitting === profile.id}
                          onClick={() => void review(profile.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </section>
        )}
      </div>
    </>
  )
}
