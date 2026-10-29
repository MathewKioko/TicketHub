import { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Tables scroll horizontally rather than squashing on narrow screens. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className={cn('w-full min-w-[640px] border-collapse text-left', className)}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-slate">
        {children}
      </tr>
    </thead>
  )
}

export function Th({
  children,
  align = 'left',
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cn('py-2.5 pr-4 font-medium', align === 'right' && 'pl-4 pr-0 text-right', className)}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <td
      className={cn('py-3.5 pr-4 align-top text-sm', align === 'right' && 'pl-4 pr-0 text-right', className)}
      {...props}
    >
      {children}
    </td>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}
