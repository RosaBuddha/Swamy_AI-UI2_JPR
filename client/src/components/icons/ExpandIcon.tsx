import * as React from "react";

interface ExpandIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const ExpandIcon: React.FC<ExpandIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 4h2v16H8zM14.94 12l-1.97-1.97 1.06-1.06L17.06 12l-3.03 3.03-1.06-1.06z"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M18 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"
      clipRule="evenodd"
    />
  </svg>
);

export default ExpandIcon;