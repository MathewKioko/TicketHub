'use client'

import { useCallback, useEffect, useState } from 'react'
import { WorkspaceTabs } from '@/components/layout/WorkspaceTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { ADMIN_TABS } from '@/lib/site'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/auto-approve', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load settings')
      const data = await response.json()
      setEnabled(!!data.enabled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const toggle = async () => {
    const next = !enabled
    setSaving(true)
    try {
      const response = await fetch('/api/admin/auto-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next, rules: {} }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setEnabled(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
          <div className="h-40 bg-shell rounded-lg" />
        </div>
      </>
    )
  }

  return (
    <>
      <WorkspaceTabs tabs={ADMIN_TABS} context="Admin console" />

      <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 lg:py-11">
        <div>
          <h1 className="display text-[38px] leading-none sm:text-[44px]">System settings</h1>
          <p className="mt-2.5 text-sm text-slate">
            Configure automatic organizer approval and platform behavior.
          </p>
        </div>

        {error && <Notice tone="danger" className="mt-6" title="Error">{error}</Notice>}

        <section className="mt-10 border border-line rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">
                Automatic organizer approval
              </h2>
              <p className="mt-1 text-xs text-slate">
                When enabled, users who apply to sell tickets are automatically approved after validation checks.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => void toggle()}
              disabled={saving}
            >
              {saving ? 'Saving…' : enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-line rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require verified email</p>
                <p className="text-xs text-slate">User must have verified their email address</p>
              </div>
              <button className={`w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-flame' : 'bg-line'}`}>
                <span className={`block w-3 h-3 rounded-full bg-bone transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="border border-line rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">No active lock</p>
                <p className="text-xs text-slate">Account must not be locked due to failed login attempts</p>
              </div>
              <button className={`w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-flame' : 'bg-line'}`}>
                <span className={`block w-3 h-3 rounded-full bg-bone transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="border border-line rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Not suspended</p>
                <p className="text-xs text-slate">Account must not be suspended by an administrator</p>
              </div>
              <button className={`w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-flame' : 'bg-line'}`}>
                <span className={`block w-3 h-3 rounded-full bg-bone transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs text-slate">
              {enabled
                ? 'Auto-approval is ON. Users who pass all validation checks will be approved as organizers immediately.'
                : 'Auto-approval is OFF. All organizer requests require manual review in the Users tab.'}
            </p>
          </div>
        </section>
      </div>
    </>
  )
}