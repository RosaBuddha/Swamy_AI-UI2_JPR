import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'suggestion' | 'tryAsking';
  className?: string;
  disabled?: boolean;
  'data-id'?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  onClick,
  variant = 'suggestion',
  className = '',
  disabled = false,
  'data-id': dataId,
}) => {
  // Default grey chip styling (for suggestions and general use)
  const baseStyle = `
    inline-flex items-center px-3 py-2
    min-h-[32px]
    text-[14px] font-medium leading-[20px]
    tracking-[-0.154px]
    font-['Inter',sans-serif]
    antialiased
    text-[#505050]
    bg-[#F4F4F4]
    border border-[#E3E3E3]
    rounded-[32px]
    cursor-pointer
    transition-colors
    hover:bg-[#EAEAEA]
    focus:outline-none focus:ring-2 focus:ring-[#E3E3E3]
    max-w-full flex-shrink-0
  `.trim();

  // Blue variant for try asking prompts
  const tryAskingStyle = `
    inline-flex items-center px-3 py-2
    min-h-[32px]
    text-[14px] font-medium leading-[20px]
    tracking-[-0.154px]
    font-['Inter',sans-serif]
    antialiased
    text-blue-700
    bg-blue-50
    border border-blue-200
    rounded-[32px]
    cursor-pointer
    transition-colors
    hover:bg-blue-100 hover:border-blue-300
    focus:outline-none focus:ring-2 focus:ring-blue-200
    max-w-full flex-shrink-0
  `.trim();

  const disabledClasses = disabled ? " opacity-50 cursor-not-allowed" : "";
  
  const finalStyle = variant === 'tryAsking' ? tryAskingStyle : baseStyle;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-id={dataId}
      className={`${finalStyle}${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};