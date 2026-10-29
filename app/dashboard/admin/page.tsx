'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { ADMIN_TABS } from '@/lib/site'
import { paymentStatus } from '@/lib/status'

interface AdminStats {
  totalUsers?: number
  totalEvents?: number
  totalTicketsSold?: number
  totalRevenue?: number
}

interface TopEvent {
  eventId: string
  title: string
  revenue?: number
}

interface RecentPayment {
  id: string
  amount: number
  status: string
  createdAt?: string
  user?: { name?: string; email?: string }
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [payments, setPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('This account does not have admin access.')
      }
      if (!response.ok) throw new Error('Platform figures could not be loaded.')
      const data = (await response.json()) as {
        stats?: AdminStats
        topEvents?: TopEvent[]
        recentPayments?: RecentPayment[]
      }
      setStats(data.stats ?? null)
      setTopEvents(data.topEvents ?? [])
      setPayments(data.recentPayments ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Platform figures could not be loaded.')
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
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[44px]">Platform overview</h1>
          <p className="mt-2.5 text-sm text-slate">Accounts, events and money across TicketHub.</p>
        </div>

        {error ? (
          <Notice
            tone="danger"
            className="mt-6"
            title="Figures unavailable"
            action={
              <Button size="sm" variant="secondary" onClick={() => void load()}>
                Try again
              </Button>
            }
          >
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 border-y border-line md:grid-cols-4">
            <div className="border-b border-line py-5 pr-4 md:border-b-0 md:border-r md:pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Accounts</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.totalUsers ?? 0)}
              </p>
            </div>
            <div className="border-b border-line py-5 pl-4 md:border-b-0 md:border-r md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Events</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.totalEvents ?? 0)}
              </p>
            </div>
            <div className="py-5 pr-4 md:border-r md:pr-6 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Tickets sold</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatNumber(stats?.totalTicketsSold ?? 0)}
              </p>
            </div>
            <div className="py-5 pl-4 md:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate">Revenue</p>
              <p className="display tnum mt-2 text-[30px] leading-none">
                {formatMoney(stats?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <section>
            <h2 className="border-b border-ink pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              Top events
            </h2>
            {topEvents.length === 0 ? (
              <p className="mt-4 text-sm text-slate">No sales recorded yet.</p>
            ) : (
              topEvents.map((event) => (
                <div key={event.eventId} className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                  <span className="truncate text-sm">{event.title}</span>
                  <span className="tnum shrink-0 text-sm">{formatMoney(event.revenue ?? 0)}</span>
                </div>
              ))
            )}
          </section>

          <section>
            <h2 className="border-b border-line pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
              Recent payments
            </h2>
            {payments.length === 0 ? (
              <p className="mt-4 text-xs text-slate">
                Payment records appear here once Paystack records a transaction.
              </p>
            ) : (
              <Table className="min-w-[420px]">
                <THead>
                  <Th>Payer</Th>
                  <Th>Status</Th>
                  <Th align="right">Amount</Th>
                </THead>
                <TBody>
                  {payments.slice(0, 6).map((payment) => (
                    <tr key={payment.id} className="border-b border-line">
                      <Td>
                        <p className="text-sm">{payment.user?.name ?? 'Guest'}</p>
                        <p className="text-xs text-slate">{formatDateTime(payment.createdAt)}</p>
                      </Td>
                      <Td>
                        <StatusBadge status={paymentStatus(payment.status)} />
                      </Td>
                      <Td align="right">
                        <span className="tnum text-sm">{formatMoney(payment.amount)}</span>
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
