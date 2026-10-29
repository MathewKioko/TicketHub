'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Notice } from '@/components/ui/Notice'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ADMIN_TABS } from '@/lib/site'

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string | null
  details?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
  user?: { id: string; name?: string | null; email?: string | null; role: string } | null
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/audit?limit=100', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('Admin access required')
      }
      if (!response.ok) throw new Error('Failed to load audit logs')
      const data = await response.json()
      setLogs(data.logs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <>
        <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
          <div className="flex flex-col gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-shell rounded-lg" />
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[44px]">Audit log</h1>
          <p className="mt-2.5 text-sm text-slate">
            Platform activity trail — every admin action, user change, and system event.
          </p>
        </div>

        {error && <Notice tone="danger" className="mt-6" title="Error">{error}</Notice>}

        <section className="mt-10 border border-line rounded-lg overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <Th className="w-[48px]">#</Th>
                <Th className="w-[160px]">Time</Th>
                <Th>Admin user</Th>
                <Th className="w-[160px]">Action</Th>
                <Th className="w-[120px]">Resource</Th>
                <Th className="w-[200px]">Details</Th>
              </tr>
            </THead>
            <TBody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={log.id} className="border-b border-line align-top">
                    <Td className="text-xs text-slate">{logs.length - i}</Td>
                    <Td className="text-xs text-slate">
                      {new Date(log.createdAt).toLocaleString()}
                    </Td>
                    <Td>
                      <p className="text-sm">{log.user?.name ?? 'System'}</p>
                      <p className="text-xs text-slate">{log.user?.email ?? '—'}</p>
                    </Td>
                    <Td>
                      <span className={`text-xs font-mono ${log.action.includes('ADMIN') ? 'text-flame' : 'text-ink'}`}>
                        {log.action}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate">{log.resource}</Td>
                    <Td className="text-xs text-slate truncate max-w-[200px]">
                      {log.details ? (() => { try { return JSON.parse(log.details).reason || JSON.parse(log.details).message || log.details.slice(0, 80) } catch { return log.details.slice(0, 80) } })() : '—'}
                    </Td>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </section>
      </div>
    </>
  )
}