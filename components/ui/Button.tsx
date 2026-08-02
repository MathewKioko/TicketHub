import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'primary' | 'secondary' | 'outline' | 'ghost'
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
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 ease-out relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center'

  const variantClasses = {
    gold: 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-onyx shadow-glow hover:shadow-glow-lg hover:from-gold-light hover:via-gold-dark hover:to-gold-deepest hover:scale-[1.03] active:scale-95',
    primary: 'bg-gradient-to-r from-gold to-gold-dark text-onyx shadow-premium shadow-gold/30 hover:shadow-glow-xl hover:shadow-gold/50 hover:scale-[1.03] active:scale-95',
    secondary: 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-light border border-gold/25 shadow-lg hover:shadow-glow hover:from-gold/30 hover:to-gold/20 hover:scale-[1.03] active:scale-95',
    outline: 'border border-gold/30 text-gold bg-transparent backdrop-blur-sm hover:bg-gold/10 hover:border-gold/50 hover:text-gold-light hover:shadow-glow hover:scale-[1.03] active:scale-95',
    ghost: 'text-gold hover:bg-gold/10 hover:text-gold-light hover:scale-[1.03] active:scale-95',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      {variant === 'gold' && (
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
      )}
    </button>
  )
}
