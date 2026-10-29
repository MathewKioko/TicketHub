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
      const data = (await response.json()) as { error?: string; event?: { id: string } }

      if (!response.ok) {
        if (response.status === 401) throw new Error('Sign in again to create an event.')
        throw new Error(data.error ?? 'The event could not be created.')
      }

      toast.success('Event created')
      router.push(data.event?.id ? `/events/${data.event.id}` : '/dashboard/organizer')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The event could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-16 sm:px-8">
        <h1 className="display text-[38px] leading-none">Create an event</h1>
        <Notice tone="info" className="mt-6" title="Sign in first">
          <Link href="/auth/login?next=%2Fevents%2Fcreate" className="underline decoration-line underline-offset-2">
            Sign in
          </Link>{' '}
          to publish an event.
        </Notice>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:py-12">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Link href="/dashboard/organizer" className="group flex items-center gap-2 text-[13px] text-slate hover:text-ink">
          <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Your events
        </Link>
        <span className="text-xs text-slate">Draft is published immediately after saving</span>
      </div>

      <div className="mt-8 max-w-[46ch]">
        <h1 className="display text-[40px] leading-[1.02]">Create an event</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Add the facts guests need to decide: what it is, when, where and what admission costs.
        </p>
      </div>

      {formError ? (
        <Notice tone="danger" className="mt-6" title="Event not created">
          {formError}
        </Notice>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        <form onSubmit={onSubmit} className="min-w-0 space-y-8" noValidate>
          <section>
            <h2 className="border-b border-ink pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              The basics
            </h2>
            <div className="mt-5 space-y-5">
              <Input
                label="Event name"
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                error={errors.title}
                placeholder="Nyimbo Live Sessions"
                required
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                >
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Cover image URL"
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) => update('imageUrl', event.target.value)}
                  hint="Optional. Organizer artwork works best at 16:9."
                  placeholder="https://…"
                />
              </div>
              <Textarea
                label="Description"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                hint="What happens, who it is for, and anything guests should bring."
                placeholder="Four hours of live music under the trees…"
              />
            </div>
          </section>

          <section>
            <h2 className="border-b border-line pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              When and where
            </h2>
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Starts"
                  type="datetime-local"
                  value={form.date}
                  onChange={(event) => update('date', event.target.value)}
                  error={errors.date}
                  required
                />
                <Input
                  label="Ends"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) => update('endDate', event.target.value)}
                  error={errors.endDate}
                  hint="Optional."
                />
              </div>
              <Input
                label="Venue"
                value={form.venue}
                onChange={(event) => update('venue', event.target.value)}
                error={errors.venue}
                placeholder="Ngong Racecourse, Nairobi"
                required
              />
            </div>
          </section>

          <section>
            <h2 className="border-b border-line pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              Admission
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_140px]">
              <Input
                label="Ticket price"
                inputMode="decimal"
                value={form.basePrice}
                onChange={(event) => update('basePrice', event.target.value.replace(/[^\d.]/g, ''))}
                error={errors.basePrice}
                hint="Leave empty or 0 for a free event."
                placeholder="2500"
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(event) => update('currency', event.target.value)}
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
              </Select>
            </div>
            <p className="mt-3 text-xs text-slate">
              One ticket tier only: the purchase flow charges this price per ticket. Ticket types are
              not sold yet.
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create event'}
            </Button>
            <Link href="/dashboard/organizer" className="link-quiet text-[13px]">
              Cancel
            </Link>
          </div>
        </form>

        <aside className="self-start lg:sticky lg:top-6">
          <div className="border border-line bg-paper">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">Preview</h2>
            </div>
            <div className="px-4 py-4">
              <div className="h-[140px] w-full overflow-hidden bg-shell">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.12em] text-slate">
                    Artwork
                  </div>
                )}
              </div>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                {form.date ? new Date(form.date).toDateString() : 'Date to be confirmed'}
              </p>
              <p className="display mt-1 text-[22px] leading-tight">
                {form.title || 'Your event name'}
              </p>
              <p className="mt-1 text-[13px] text-slate">{form.venue || 'Venue'}</p>
              <p className="tnum mt-2 text-sm font-medium">
                {form.basePrice === '' || Number(form.basePrice) === 0
                  ? 'Free'
                  : formatMoney(Number(form.basePrice))}
              </p>
            </div>
            <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-slate">
              Guests see exactly this card in the programme and on the event page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
