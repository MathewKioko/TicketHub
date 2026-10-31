'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/components/providers/AuthProvider'
import { EVENT_CATEGORIES } from '@/lib/site'
import { formatMoney } from '@/lib/format'

interface FormState {
  title: string
  category: string
  description: string
  date: string
  endDate: string
  venue: string
  imageUrl: string
  basePrice: string
  currency: string
}

const EMPTY: FormState = {
  title: '',
  category: 'Music',
  description: '',
  date: '',
  endDate: '',
  venue: '',
  imageUrl: '',
  basePrice: '',
  currency: 'KES',
}

export default function CreateEventPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)  // NEW: success state
  const [payError, setPayError] = useState<string | null>(null)
  const [isAutoPublish, setIsAutoPublish] = useState(false)  // NEW: show if auto-published

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) next.title = 'Give the event a name guests will recognise.'
    if (!form.venue.trim()) next.venue = 'Where is it happening?'
    if (!form.date) next.date = 'Pick the start date and time.'
    if (form.date && form.endDate && new Date(form.endDate) <= new Date(form.date)) {
      next.endDate = 'The end time must be after the start.'
    }
    if (form.basePrice !== '' && Number(form.basePrice) < 0) next.basePrice = 'Price cannot be negative.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    setSuccess(false)
    try {
      const price = form.basePrice === '' ? 0 : Number(form.basePrice)
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          venue: form.venue.trim(),
          date: new Date(form.date).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          category: form.category,
          imageUrl: form.imageUrl.trim() || undefined,
          basePrice: price,
          currency: form.currency,
        }),
      })
      const data = (await response.json()) as { error?: string; event?: { id: string; status?: string } }

      if (!response.ok) {
        if (response.status === 401) throw new Error('Sign in again to create an event.')
        throw new Error(data.error ?? 'The event could not be created.')
      }

      // Show success state
      setSuccess(true)
      setSubmitting(false)

      // Redirect after 2 seconds to event page
      setTimeout(() => {
        router.push(data.event?.id ? `/events/${data.event.id}` : '/dashboard/organizer')
      }, 2000)
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'The event could not be created.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[620px] px-5 py-10 sm:px-8 lg:py-14">
      {authLoading ? (
        <div className="mt-10 space-y-4">
          <span className="h-6 w-40 animate-pulse rounded-sm bg-shell" />
          <span className="h-24 w-full animate-pulse rounded-sm bg-shell" />
        </div>
      ) : !user ? (
        <div className="mx-auto max-w-[620px] px-5 py-16 sm:px-8">
          <h1 className="display text-[34px] leading-tight">Sign in to create an event</h1>
          <Notice tone="warning" className="mt-5" title="Authentication required">
            You need to be signed in to publish an event.
          </Notice>
          <Link
            href={`/auth/login?next=${encodeURIComponent('/events/create')}`}
            className="mt-6 inline-block border border-ink px-5 py-2.5 text-[13px] font-medium hover:bg-ink hover:text-bone"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          <h1 className="display text-[34px] leading-tight">Create an event</h1>
          <p className="text-sm leading-relaxed text-slate">
            Fill in the details below. Your event will be published immediately if your account is verified.
          </p>

          {formError ? (
            <Notice tone="danger" className="mt-4" title="Could not create event">{formError}</Notice>
          ) : null}

          {payError ? (
            <Notice tone="danger" className="mt-4" title="Error">{payError}</Notice>
          ) : null}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Event title</label>
              <Input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Afrobeat Night at The Alchemist"
                error={errors.title}
              />
              {errors.title ? <p className="text-xs text-crimson">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Category</label>
              <Select
                onChange={(e) => update('category', e.target.value as FormState['category'])}
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Tell guests what to expect…"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Venue</label>
            <Input
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
              placeholder="e.g. The Alchemist Bar, Westlands"
              error={errors.venue}
            />
            {errors.venue ? <p className="text-xs text-crimson">{errors.venue}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Start date &amp; time</label>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                error={errors.date}
              />
              {errors.date ? <p className="text-xs text-crimson">{errors.date}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">End date &amp; time (optional)</label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                error={errors.endDate}
              />
              {errors.endDate ? <p className="text-xs text-crimson">{errors.endDate}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Base price</label>
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-semibold text-slate">KES</span>
                <Input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => update('basePrice', e.target.value)}
                  placeholder="0"
                  error={errors.basePrice}
                />
              </div>
              {errors.basePrice ? <p className="text-xs text-crimson">{errors.basePrice}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Currency</label>
              <Select
                onChange={(e) => update('currency', e.target.value as FormState['currency'])}
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate">Event image URL (optional)</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => update('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm text-slate">
              {isAutoPublish
                ? 'Your account is verified — this event will be published immediately.'
                : 'Your account is not yet verified — the event will be created as PENDING and reviewed before publishing.'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Creating…' : 'Publish event'}
            </Button>
            <Link
              href="/dashboard/organizer"
              className="inline-block border border-line px-5 py-2.5 text-[13px] text-slate hover:bg-shell"
            >
              Cancel
            </Link>
          </div>

          {success ? (
            <div className="mt-6 border border-line bg-shell rounded-sm p-6 text-center">
              <h2 className="font-semibold">Event created</h2>
              <p className="text-sm text-slate mt-2">Redirecting to your event…</p>
            </div>
          ) : null}
        </form>
      )}
    </div>
  )
}
