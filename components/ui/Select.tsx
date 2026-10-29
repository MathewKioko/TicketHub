'use client'

import { ReactNode, SelectHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref
) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedBy =
    [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-xs font-medium text-ink">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('field appearance-none pr-8', error && 'border-crimson focus:border-crimson', className)}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-crimson">
          {error}
        </p>
      ) : null}
    </div>
  )
})
