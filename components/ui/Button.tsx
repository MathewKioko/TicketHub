import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-bone hover:bg-ink-soft',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-bone',
  ghost: 'border border-line text-ink hover:border-ink',
  danger: 'bg-crimson text-bone hover:bg-[#7A1A15]',
  link: 'px-0 text-ink underline decoration-line underline-offset-4 hover:decoration-flame',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

interface StyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * Use this for links that must look like buttons, instead of nesting a
 * <button> inside an <a> (which is invalid and breaks keyboard navigation).
 */
export function buttonStyles({ variant = 'primary', size = 'md', className }: StyleOptions = {}): string {
  return cn(BASE, VARIANTS[variant], variant === 'link' ? '' : SIZES[size], className)
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  )
})
