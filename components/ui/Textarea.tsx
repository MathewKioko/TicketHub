'use client'

import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 5, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('field resize-y leading-relaxed', error && 'border-crimson focus:border-crimson', className)}
        {...props}
      />
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
