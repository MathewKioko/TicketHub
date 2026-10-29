import { HTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * A bordered surface. One separator per surface: this component deliberately
 * carries a border and no shadow, so elevation never competes with structure.
 */
export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Panel(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn('border border-line bg-paper', className)} {...props} />
})

interface PanelHeaderProps {
  title: string
  meta?: string
  action?: ReactNode
  className?: string
}

export function PanelHeader({ title, meta, action, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-3.5',
        className
      )}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]">{title}</h2>
      {meta ? <span className="text-xs text-slate">{meta}</span> : null}
      {action}
    </div>
  )
}
