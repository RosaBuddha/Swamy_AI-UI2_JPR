import React, { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  'data-id'?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', 'data-id': dataId, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-id={dataId}
        className={`
          h-8 px-3
          inline-flex items-center justify-center
          text-sm font-medium
          bg-gray-50 text-gray-900
          border border-[#CCCCCC] rounded
          hover:bg-[#F4F4F4]
          focus:outline-none focus:ring-2 focus:ring-gray-500
          transition-colors
          disabled:text-[#CCCCCC]
          disabled:border-[#CCCCCC]
          disabled:hover:bg-gray-50
          disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'