'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

const RadioGroupContext = React.createContext<{
  value: string | undefined
  onValueChange?: (value: string) => void
  disabled?: boolean
}>({ value: undefined })

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export function RadioGroup({ value, defaultValue, onValueChange, disabled, children, className, ...props }: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
  const currentValue = value ?? internalValue

  const contextValue = React.useMemo(
    () => ({ value: currentValue, onValueChange, disabled }),
    [currentValue, onValueChange, disabled]
  )

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div role="radiogroup" className={cn(className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLInputElement> {
  value: string
  disabled?: boolean
}

export function RadioGroupItem({ value, disabled, className, ...props }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  const isDisabled = disabled || context.disabled
  const isChecked = context.value === value

  const handleChange = () => {
    if (isDisabled) return
    context.onValueChange?.(value)
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <input
        type="radio"
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleChange}
        {...props}
        className={cn(
          'h-4 w-4 shrink-0 rounded-full border-current text-ink focus:ring-0',
          isChecked && 'after:absolute after:h-2 after:w-2 after:rounded-full after:bg-current after:bg-ink after:content-[""]',
          'peer cursor-pointer focus:outline-none',
        )}
      />
      {props.children && <span className="peer-checked:text-ink">{props.children}</span>}
    </div>
  )
}

RadioGroupItem.displayName = 'RadioGroupItem'