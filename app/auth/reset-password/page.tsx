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

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setToken(params.get('token'))
      if (!params.get('token')) {
        setMessage({
          type: 'error',
          text: 'No reset token provided. Please request a new password reset.',
        })
      }
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordForm) {
    setMessage(null)
    if (!token) {
      setMessage({ type: 'error', text: 'No reset token provided.' })
      return
    }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error ?? 'Something went wrong.' })
        return
      }

      setMessage({ type: 'success', text: result.message })
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch {
      setMessage({ type: 'error', text: 'We could not reach the server. Check your connection and try again.' })
    }
  }

  return (
    <>
      <FocusedHeader rightLabel="Browse events" rightHref="/events" />
      <div className="mx-auto max-w-[440px] px-5 py-10 sm:px-8 lg:py-14">
        <h1 className="display text-[40px] leading-[1.02]">Reset your password</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Enter your new password below.
        </p>

        {message ? (
          <Notice tone={message.type === 'success' ? 'success' : 'danger'} className="mt-6">
            {message.text}
          </Notice>
        ) : null}

        {!token ? (
          <p className="mt-6 text-sm text-slate">
            Invalid or missing reset link. Please request a new password reset.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            {errors.password && (
              <p id="password-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
                {errors.password.message}
              </p>
            )}

            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="mt-1.5 text-xs font-medium text-crimson" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-[13px] text-slate">
          Remember your password?{' '}
          <Link href="/auth/login" className="link-quiet text-ink">
            Sign in
          </Link>
          .
        </p>
      </div>
      <p className="text-[11px] text-slate">© {new Date().getFullYear()} TicketHub · Nairobi, Kenya</p>
    </>
  )
}
