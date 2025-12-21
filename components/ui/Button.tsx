import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-bold rounded-xl transition-all duration-500 ease-out relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shine'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-premium shadow-primary-500/30 hover:shadow-glow-xl hover:shadow-primary-500/50 hover:from-primary-600 hover:to-primary-700 hover:scale-110 active:scale-95',
    secondary: 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg hover:shadow-premium hover:from-primary-200 hover:to-primary-300 hover:scale-110 active:scale-95',
    outline: 'border-2 border-primary-500 text-primary-600 bg-white/90 backdrop-blur-sm hover:bg-primary-50 hover:border-primary-600 hover:shadow-premium hover:scale-110 active:scale-95 premium-border',
    ghost: 'text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:scale-110 active:scale-95',
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
      )}
    </button>
  )
}

