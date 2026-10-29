'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Notice } from '@/components/ui/Notice'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, TBody, Td, Th, THead } from '@/components/ui/Table'
import { ADMIN_TABS } from '@/lib/site'
import { roleLabel } from '@/lib/status'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  verified: boolean
  createdAt?: string
  organizerRequestStatus?: string | null
}

type AdminAction = 'approve' | 'reject' | 'make_organizer' | 'make_attendee'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [requestFilter, setRequestFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function suspendUser(userId: string, action: 'suspend' | 'unsuspend') {
    if (busyId) return
    setBusyId(userId)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'That change was rejected.')
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'That change was rejected.')
    } finally {
      setBusyId(null)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (search.trim()) params.set('search', search.trim())
      if (roleFilter) params.set('role', roleFilter)
      if (requestFilter) params.set('requestStatus', requestFilter)

      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' })
      if (response.status === 401 || response.status === 403) {
        throw new Error('This account does not have admin access.')
      }
      if (!response.ok) throw new Error('Users could not be loaded.')

      const data = (await response.json()) as { users?: AdminUser[] }
      setUsers(data.users ?? [])
    } catch (loadError) {
      setUsers([])
      setError(loadError instanceof Error ? loadError.message : 'Users could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, requestFilter])

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250)
    return () => clearTimeout(timer)
  }, [load])

  async function act(userId: string, action: AdminAction) {
    if (busyId) return
    setBusyId(userId)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'That change was rejected.')
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'That change was rejected.')
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = users.filter(
    (user) => user.role === 'PENDING_ORGANIZER' || user.organizerRequestStatus === 'pending'
  ).length

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[38px] leading-none sm:text-[44px]">Users</h1>
            <p className="mt-2.5 text-sm text-slate">
              {pendingCount > 0
                ? `${pendingCount} organizer ${pendingCount === 1 ? 'application' : 'applications'} waiting for review.`
                : 'No organizer applications are waiting.'}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="user-search" className="sr-only">
              Search users
            </label>
            <input
              id="user-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="field"
            />
          </div>
          <label className="sr-only" htmlFor="role-filter">
            Filter by role
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="field sm:w-[190px]"
          >
            <option value="">All roles</option>
            <option value="ATTENDEE">Attendees</option>
            <option value="EVENT_OWNER">Organizers</option>
            <option value="ADMIN">Administrators</option>
            <option value="PENDING_ORGANIZER">Pending organizer</option>
          </select>
          <label className="sr-only" htmlFor="request-filter">
            Filter by request status
          </label>
          <select
            id="request-filter"
            value={requestFilter}
            onChange={(event) => setRequestFilter(event.target.value)}
            className="field sm:w-[190px]"
          >
            <option value="">All requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error ? (
          <Notice tone="danger" className="mt-5" title="Something went wrong">
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No users match those filters"
              description="Clear the search or pick a different role to see everyone."
            />
          </div>
        ) : (
          <div className="mt-6">
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th align="right">Action</Th>
              </THead>
              <TBody>
                {users.map((user) => {
                  const pending = user.role === 'PENDING_ORGANIZER' || user.organizerRequestStatus === 'pending'
                  const isOrganizer = user.role === 'ORGANIZER' || user.role === 'EVENT_OWNER'
                  return (
                    <tr key={user.id} className="border-b border-line align-top">
                      <Td>
                        <p className="font-medium">{user.name}</p>
                        <p className="mt-0.5 text-xs text-slate">{user.email}</p>
                      </Td>
                      <Td>{roleLabel(user.role)}</Td>
                      <Td>
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge
                            status={
                              user.verified
                                ? { label: 'Email verified', tone: 'positive' }
                                : { label: 'Not verified', tone: 'pending' }
                            }
                          />
                          {user.organizerRequestStatus === 'suspended' ? (
                            <StatusBadge status={{ label: 'Suspended by admin', tone: 'danger' }} />
                          ) : pending ? (
                            <StatusBadge status={{ label: 'Application pending', tone: 'pending' }} />
                          ) : null}
                        </div>
                      </Td>
                      <Td align="right">
                        {user.organizerRequestStatus === 'suspended' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => void suspendUser(user.id, 'unsuspend')}
                              disabled={busyId === user.id}
                            >
                              Unsuspend
                            </Button>
                          </div>
                        ) : pending ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => void act(user.id, 'approve')}
                              disabled={busyId === user.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void act(user.id, 'reject')}
                              disabled={busyId === user.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : user.role === 'ADMIN' ? (
                          <span className="text-xs text-slate">Managed separately</span>
                        ) : (
                          <>
                            <label className="sr-only" htmlFor={`role-${user.id}`}>
                              Change role for {user.name}
                            </label>
                            <select
                              id={`role-${user.id}`}
                              value={isOrganizer ? 'make_organizer' : 'make_attendee'}
                              onChange={(event) => void act(user.id, event.target.value as AdminAction)}
                              disabled={busyId === user.id}
                              className="field ml-auto w-[168px] text-xs"
                            >
                              <option value="make_attendee">Attendee</option>
                              <option value="make_organizer">Organizer</option>
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void suspendUser(user.id, 'suspend')}
                              disabled={busyId === user.id}
                              className="text-flame hover:bg-flame-soft ml-2"
                            >
                              Suspend
                            </Button>
                          </>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </TBody>
            </Table>
            <p className="mt-3 text-xs text-slate">
              Approving an application makes the account an organizer. Administrator access is granted
              in the Admin Roles tab. Suspended users cannot log in.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
