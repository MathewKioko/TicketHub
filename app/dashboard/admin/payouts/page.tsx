'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { formatDateTime, formatMoney } from '@/lib/format'
import { ADMIN_TABS } from '@/lib/site'
import { payoutStatus } from '@/lib/status'

interface Payout {
  id: string
  amount: number
  status: string
  paymentMethod?: 'MPESA' | 'PAYSTACK' | null
  bankName?: string | null
  accountNumber?: string | null
  reference?: string | null
  mpesaReceiptNumber?: string | null
  mpesaPhoneNumber?: string | null
  paystackReference?: string | null
  createdAt?: string
  eventOwner?: { name?: string; email?: string }
}

/**
 * Get payment method badge component
 */
function paymentMethodBadge(paymentMethod?: string | null) {
  if (!paymentMethod) return null
  if (paymentMethod === 'MPESA') {
    return (
      <span className="px-2 py-1 text-xs text-white bg-green-600 rounded-full">
        M-Pesa
      </span>
    )
  }
  if (paymentMethod === 'PAYSTACK') {
    return (
      <span className="px-2 py-1 text-xs text-white bg-blue-600 rounded-full">
        Paystack
      </span>
    )
  }
  return null
}

/** Never render a full account number in a list. */
function maskAccount(value?: string | null): string {
  if (!value) return '—'
  const digits = value.replace(/\s/g, '')
  return digits.length <= 4 ? `•••• ${digits}` : `•••• ${digits.slice(-4)}`
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/payouts', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('This account does not have admin access.')
      }
      if (!response.ok) throw new Error('Payouts could not be loaded.')
      const data = (await response.json()) as { payouts?: Payout[] }
      setPayouts(data.payouts ?? [])
    } catch (loadError) {
      setPayouts([])
      setError(loadError instanceof Error ? loadError.message : 'Payouts could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[38px] leading-none sm:text-[44px]">Payouts</h1>
            <p className="mt-2.5 text-sm text-slate">
              Organizer settlements recorded against Paystack.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {error ? (
          <Notice tone="danger" className="mt-6" title="Payouts unavailable">
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No payouts recorded"
              description="Payout records are written when a settlement runs. Until then this list stays empty."
            />
          </div>
        ) : (
          <div className="mt-6">
            <Table>
              <THead>
                <Th>Payout</Th>
                <Th>Organizer</Th>
                <Th>Bank</Th>
                <Th>Status</Th>
                <Th align="right">Amount</Th>
              </THead>
              <TBody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-line align-top">
                    <Td>
                      <p className="tnum text-sm">{payout.reference ?? payout.id}</p>
                      <p className="text-xs text-slate">{formatDateTime(payout.createdAt)}</p>
                    </Td>
                    <Td>
                      {/* The payouts endpoint does not join the owner, so say so
                          rather than printing the word "Organizer" as a name. */}
                      <p className="text-sm">{payout.eventOwner?.name ?? 'Not recorded'}</p>
                      <p className="text-xs text-slate">{payout.eventOwner?.email ?? ''}</p>
                    </Td>
                    <Td>
                      <p className="text-sm">{payout.bankName ?? '—'}</p>
                      <p className="tnum text-xs text-slate">{maskAccount(payout.accountNumber)}</p>
                    </Td>
                    <Td>
                      <StatusBadge status={payoutStatus(payout.status)} />
                    </Td>
                    <Td align="right">
                      <span className="tnum text-sm">{formatMoney(payout.amount)}</span>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
            <p className="mt-3 text-xs text-slate">Account numbers are masked. Full details are held by Paystack.</p>
          </div>
        )}
      </div>
    </>
  )
}



