import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'elevated'
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantClasses = {
    default: 'bg-white shadow-soft hover:shadow-premium transition-all duration-500 card-hover',
    glass: 'glass-premium shadow-premium hover:shadow-glow-xl transition-all duration-500 card-hover',
    elevated: 'bg-white shadow-premium-lg hover:shadow-glow-xl transition-all duration-500 hover:-translate-y-2 card-hover',
  }
  
  return (
    <div className={`rounded-2xl p-6 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}

