import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-ivory/70 mb-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-gold/20 focus:border-gold/40 outline-none text-ivory bg-coal/70 backdrop-blur-sm transition-all duration-300 placeholder:text-taupe/50 ${
            error
              ? 'border-blush/50 focus:border-blush focus:ring-blush/20'
              : 'border-white/10 hover:border-gold/30'
          } ${className}`}
          {...props}
        />
        {!error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold/0 via-gold/0 to-gold/0 group-focus-within:from-gold/5 group-focus-within:via-gold/10 group-focus-within:to-gold/5 transition-all duration-300 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-blush font-medium animate-fade-in-up">
          {error}
        </p>
      )}
    </div>
  )
}

