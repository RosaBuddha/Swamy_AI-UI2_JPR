import React from 'react'
import { MoreHorizontal, Pin, Edit3, Trash2 } from 'lucide-react'
import { Dropdown } from '../Dropdown'

export interface ComparisonItemProps {
  text: string
  isSelected?: boolean
  onPin?: () => void
  onRename?: () => void
  onDelete?: () => void
  isPinned?: boolean
  className?: string
  onClick?: () => void
  'data-id'?: string
}

export const ComparisonItem = ({
  text,
  isSelected = false,
  onPin,
  onRename,
  onDelete,
  isPinned = false,
  className = '',
  onClick,
  'data-id': dataId,
}: ComparisonItemProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const dropdownItems = [
    {
      label: isPinned ? 'Unpin' : 'Pin',
      onClick: () => onPin?.(),
      icon: <Pin className="w-4 h-4" />,
    },
    {
      label: 'Rename',
      onClick: () => onRename?.(),
      icon: <Edit3 className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: () => onDelete?.(),
      icon: <Trash2 className="w-4 h-4" />,
      destructive: true,
    },
  ]

  return (
    <div className="relative">
      <div
        data-id={dataId}
        onClick={onClick}
        className={`group flex cursor-pointer items-center rounded px-3 py-1 w-full transition-colors font-['Inter',_sans-serif]
          ${isSelected ? 'bg-blue-100-custom' : 'hover:bg-[rgba(0,0,0,0.04)]'}
          ${className}`}
      >
        <div className="flex items-center gap-2 flex-grow overflow-hidden">
          {isPinned && <Pin className="w-3 h-3 text-gray-500 flex-shrink-0" />}
          <div
            title={text}
            className={`flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-4 ${
              isSelected ? 'text-blue-700-custom' : ''
            }`}
            style={{ color: isSelected ? undefined : '#505050' }}
          >
            {text}
          </div>
        </div>
        <div
          className={`flex-shrink-0 transition-opacity duration-200
          ${isSelected ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsDropdownOpen(!isDropdownOpen)
            }}
            aria-label="More options"
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg p-0.5 text-[#222C2E] transition-colors hover:text-[rgb(73,84,100)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <Dropdown
        items={dropdownItems}
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
      />
    </div>
  )
}