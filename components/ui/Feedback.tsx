import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-sm bg-shell', className)} />
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('border border-line bg-paper px-6 py-12 text-center', className)}>
      <p className="display text-[22px] leading-tight">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-slate">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-slate">
      <span
        aria-hidden
        className="block h-4 w-4 animate-spin rounded-full border-[1.5px] border-line border-t-ink"
      />
      {label}
    </span>
  )
}
