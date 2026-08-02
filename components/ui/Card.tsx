import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'elevated'
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantClasses = {
    default: 'bg-ash/60 backdrop-blur-xl border border-gold/15 shadow-soft hover:shadow-premium transition-all duration-300 card-hover',
    glass: 'glass-luxe shadow-premium hover:shadow-glow-xl transition-all duration-300 card-hover',
    elevated: 'bg-ash/60 border border-gold/15 shadow-premium-lg hover:shadow-glow-xl transition-all duration-300 hover:-translate-y-1.5 card-hover',
  }

  return (
    <div className={`rounded-2xl p-5 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
