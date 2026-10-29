import { StatusMeta, TONE_CLASS } from '@/lib/status'
import { cn } from '@/lib/cn'

interface StatusBadgeProps {
  status: StatusMeta
  className?: string
  /** Adds a matching soft tint behind the label for table cells that need emphasis. */
  outline?: boolean
}

const TONE_RING: Record<string, string> = {
  neutral: 'border-line',
  positive: 'border-[#C9DCD1]',
  pending: 'border-[#E6D3B3]',
  danger: 'border-[#E3C4C0]',
}

export function StatusBadge({ status, className, outline = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-xs',
        outline && 'rounded-sm border px-2 py-1',
        outline && TONE_RING[status.tone],
        className
      )}
    >
      <span aria-hidden className={cn('block h-[6px] w-[6px] shrink-0 rounded-full', TONE_CLASS[status.tone])} />
      {status.label}
    </span>
  )
}
