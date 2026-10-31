'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { FocusedHeader } from '@/components/layout/FocusedHeader'

export const dynamic = 'force-dynamic'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [next, setNext] = useState<string>('/dashboard/attendee')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setNext(params.get('next') ?? '/dashboard/attendee')
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordForm) {
    setMessage(null)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error ?? 'Something went wrong.' })
        return
      }

      setMessage({
        type: 'success',
        text:
          'If an account exists for this email, you will receive a password reset link. Check your inbox.',
      })
    } catch {
      setMessage({ type: 'error', text: 'We could not reach the server. Check your connection and try again.' })
    }
  }

  return (
    <>
      <FocusedHeader rightLabel="Browse events" rightHref="/events" />
      <div className="mx-auto max-w-[440px] px-5 py-10 sm:px-8 lg:py-14">
        <h1 className="display text-[40px] leading-[1.02]">Forgot password?</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {message ? (
          <Notice tone={message.type === 'success' ? 'success' : 'danger'} className="mt-6">
            {message.text}
          </Notice>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
              {errors.email.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-6 text-[13px] text-slate">
          Remember your password?{' '}
          <Link
            href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'}
            className="link-quiet text-ink"
          >
            Sign in
          </Link>
          .
        </p>
        <p className="mt-2 text-xs text-slate">
          New to TicketHub?{' '}
          <Link href="/auth/signup" className="link-quiet text-ink">
            Create an account
          </Link>
          .
        </p>
      </div>
      <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
    </>
  )
}
