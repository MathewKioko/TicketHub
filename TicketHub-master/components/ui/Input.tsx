import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-400 ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-200 hover:border-gray-300'
          } ${className}`}
          {...props}
        />
        {!error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-focus-within:from-primary-500/5 group-focus-within:via-primary-500/10 group-focus-within:to-primary-500/5 transition-all duration-300 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium animate-fade-in-up">
          {error}
        </p>
      )}
    </div>
  )
}

