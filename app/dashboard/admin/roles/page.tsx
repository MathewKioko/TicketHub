'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ADMIN_TABS } from '@/lib/site'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt?: string
  verified: boolean
}

export default function AdminRolesPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/role', { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('Admin access required')
      }
      if (!response.ok) throw new Error('Failed to load admins')
      const data = await response.json()
      setAdmins(data.admins ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load administrators')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleGrant = async () => {
    if (!grantEmail.trim()) return
    setGrantBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: grantEmail.trim(), action: 'grant' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to grant admin access')
      setGrantEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant admin access')
    } finally {
      setGrantBusy(false)
    }
  }

  const handleRevoke = async (email: string) => {
    if (!confirm(`Revoke admin access for ${email}?`)) return
    setError(null)
    try {
      const response = await fetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'revoke' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to revoke admin access')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke admin access')
    }
  }

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
          <h1 className="display text-[38px] leading-none sm:text-[44px]">Administrator roles</h1>
          <p className="mt-2.5 text-sm text-slate">
            Grant or revoke platform administrator access. Administrators can manage users, events, payouts, and system settings.
          </p>
        </div>

        {error && <Notice tone="danger" className="mt-6" title="Error">{error}</Notice>}

        <section className="mt-10 border border-line rounded-lg">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Grant administrator access</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <Input
                label="Email address"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-[320px]"
              />
              <Button
                onClick={() => void handleGrant()}
                disabled={grantBusy || !grantEmail.trim()}
              >
                {grantBusy ? 'Granting…' : 'Grant admin access'}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-10 border border-line rounded-lg">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Current administrators</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Verified</Th>
                  <Th>Joined</Th>
                  <Th className="w-[160px]">Action</Th>
                </tr>
              </THead>
              <TBody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate">
                      No administrators found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-line align-top">
                      <Td>
                        <p className="font-medium">{admin.name}</p>
                        <p className="mt-0.5 text-xs text-slate">{admin.email}</p>
                      </Td>
                      <Td>{admin.email}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-flame-soft text-flame text-xs font-medium">
                          ADMIN
                        </span>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${admin.verified ? 'bg-green-soft text-green' : 'bg-line text-slate'}`}>
                          {admin.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </Td>
                      <Td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-'}</Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleRevoke(admin.email)}
                          className="text-flame hover:bg-flame-soft"
                        >
                          Revoke admin
                        </Button>
                      </Td>
                    </tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </section>
      </div>
    </>
  )
}