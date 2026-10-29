import Link from 'next/link'

interface FocusedHeaderProps {
  rightLabel?: string
  rightHref?: string
  /** Use a forward arrow for "next step" links instead of the back arrow. */
  forward?: boolean
  maxWidth?: string
}

/**
 * Chrome for focused flows (checkout, tickets, scanner, auth): the wordmark plus
 * exactly one way out, so the flow cannot be wandered away from by accident.
 */
export function FocusedHeader({
  rightLabel = 'All events',
  rightHref = '/events',
  forward = false,
  maxWidth = 'max-w-[1180px]',
}: FocusedHeaderProps) {
  return (
    <header className="border-b border-line print-hide">
      <div className={`mx-auto flex h-[66px] ${maxWidth} items-center justify-between px-5 sm:px-8`}>
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="block h-[10px] w-[10px] bg-flame" />
          <span className="text-[15px] font-semibold tracking-[0.17em]">TICKETHUB</span>
        </Link>
        <Link href={rightHref} className="group flex items-center gap-2 text-[13px] text-slate hover:text-ink">
          {forward ? null : (
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
          )}
          {rightLabel}
          {forward ? (
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  )
}
