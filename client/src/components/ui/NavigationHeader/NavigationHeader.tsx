import React from 'react'
import { Icon1 } from './Icon1'

export interface NavigationHeaderProps {
  /**
   * The title to display in the header
   */
  title: string
  /**
   * The URL of the logo image
   */
  logoUrl: string
  /**
   * Optional click handler for the collapse button
   */
  onCollapseClick?: () => void
  /**
   * Optional click handler for the logo
   */
  onLogoClick?: () => void
  /**
   * Optional data-id for testing
   */
  'data-id'?: string
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  logoUrl,
  onCollapseClick,
  onLogoClick,
  'data-id': dataId,
}) => {
  return (
    <div
      className="flex items-center gap-3 py-2 pl-2 w-full text-base leading-6 font-[Inter]"
      data-id={dataId}
    >
      <div className="flex-shrink-0">
        <img
          alt="logo"
          src={logoUrl}
          className="block h-8 w-8 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-300"
          onClick={onLogoClick}
        />
      </div>
      <div className="flex-grow overflow-hidden whitespace-nowrap text-ellipsis text-sm font-semibold leading-[22px] text-[#222C2E]">
        {title}
      </div>
      <button
        type="button"
        onClick={onCollapseClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
        aria-label="Toggle navigation"
      >
        <Icon1 className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}