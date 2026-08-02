'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, LayoutDashboard, CalendarPlus, ScanLine, Settings, Users, DollarSign, LogOut, Menu, X, Ticket, Building2 } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface DashboardSidebarProps {
  role: 'organizer' | 'admin' | 'owner'
  userName?: string
}

const navConfig: Record<DashboardSidebarProps['role'], NavItem[]> = {
  organizer: [
    { label: 'Dashboard', href: '/dashboard/organizer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Create Event', href: '/events/create', icon: <CalendarPlus className="w-5 h-5" /> },
    { label: 'Scanner', href: '/scanner', icon: <ScanLine className="w-5 h-5" /> },
    { label: 'Settings', href: '/dashboard/organizer/settings', icon: <Settings className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Overview', href: '/dashboard/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Manage Users', href: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Payouts', href: '/dashboard/admin/payouts', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Browse Events', href: '/events', icon: <Ticket className="w-5 h-5" /> },
    { label: 'Scanner', href: '/scanner', icon: <ScanLine className="w-5 h-5" /> },
  ],
  owner: [
    { label: 'Dashboard', href: '/dashboard/owner', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Create Event', href: '/events/create', icon: <CalendarPlus className="w-5 h-5" /> },
    { label: 'Payout Settings', href: '/dashboard/owner/profile', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Scanner', href: '/scanner', icon: <ScanLine className="w-5 h-5" /> },
  ],
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const items = navConfig[role]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('TicketHub_userId')
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/organizer') return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gold/10">
<Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-gold/20 rounded-xl blur-sm" />
            <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="TicketHub"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
          <div>
            <span className="font-display text-lg font-bold gradient-text leading-none">TicketHub</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-taupe mt-0.5">
              {role} Console
            </span>
          </div>
        </Link>
      </div>

      {/* User */}
      <div className="px-6 py-5 border-b border-gold/10">
        {userName && (
          <p className="text-sm text-taupe mb-1">Signed in as</p>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold-dark/20 border border-gold/30 flex items-center justify-center">
            <span className="font-display font-bold text-gold">
              {userName ? userName.charAt(0).toUpperCase() : 'G'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ivory truncate">
              {userName || 'Guest'}
            </p>
            <p className="text-[11px] text-taupe capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] text-taupe/60 px-3 pb-2">Menu</p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx shadow-glow'
                : 'text-ivory/70 hover:bg-gold/5 hover:text-gold hover:translate-x-1'
            }`}
          >
            <span className={isActive(item.href) ? 'text-onyx' : 'text-gold/70'}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-gold/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blush/80 hover:text-blush hover:bg-blush/5 transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-coal/40 border-r border-gold/10 backdrop-blur-xl sticky top-0 h-screen">
        {sidebarContent}
      </aside>

{/* Mobile topbar */}
      <div className="lg:hidden glass-dark border-b border-gold/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
<Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center">
              <img
                src="/logo.png"
                alt="TicketHub"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="font-display font-bold gradient-text">TicketHub</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* My Tickets quick link on mobile */}
            <Link
              href="/dashboard/attendee"
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gold border border-gold/20 rounded-lg hover:bg-gold/10"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tickets</span>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="p-2 text-ivory/70 hover:text-gold transition-colors"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="px-4 pb-4 animate-fade-in-down max-h-[80vh] overflow-y-auto">
            {sidebarContent}
          </div>
        )}
      </div>
    </>
  )
}

