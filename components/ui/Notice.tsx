import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type NoticeTone = 'info' | 'warning' | 'danger' | 'success'

const TONES: Record<NoticeTone, string> = {
  info: 'border-line bg-shell text-ink',
  warning: 'border-[#E6D3B3] bg-[#FBF4E7] text-[#5B3B0A]',
  danger: 'border-[#E3C4C0] bg-[#FBF0EE] text-[#7A1A15]',
  success: 'border-[#C9DCD1] bg-[#F0F6F2] text-[#1C5C42]',
}

interface NoticeProps {
  tone?: NoticeTone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Notice({ tone = 'info', title, children, action, className }: NoticeProps) {
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('border px-4 py-3.5 text-sm', TONES[tone], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? (
        <div className={cn('text-[13px] leading-relaxed', title && 'mt-1')}>{children}</div>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
