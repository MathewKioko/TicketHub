'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { activeHref, NavLink } from '@/lib/site'

interface WorkspaceTabsProps {
  tabs: NavLink[]
  context?: string
  children?: React.ReactNode
}

/**
 * A thin section bar under the global header. Not sticky, so the page keeps
 * within the chrome budget, and only one global header ever renders.
 */
export function WorkspaceTabs({ tabs, context, children }: WorkspaceTabsProps) {
  const pathname = usePathname()
  const currentHref = activeHref(pathname, tabs.map((tab) => tab.href))

  return (
    <div className="border-b border-line bg-bone">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 sm:px-8">
        <nav aria-label="Workspace" className="flex items-center gap-7 overflow-x-auto text-[13px]">
          {tabs.map((tab) => {
            const active = currentHref === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap border-b-2 py-3 transition-colors',
                  active
                    ? 'border-flame font-medium text-ink'
                    : 'border-transparent text-slate hover:border-line hover:text-ink'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-4 py-3 text-xs text-slate">
          {context ? <span>{context}</span> : null}
          {children}
        </div>
      </div>
    </div>
  )
}
