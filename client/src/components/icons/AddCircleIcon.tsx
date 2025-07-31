import * as React from "react";

interface AddCircleIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const AddCircleIcon: React.FC<AddCircleIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m-1 5v4H7v2h4v4h2v-4h4v-2h-4V7zm-7 5c0 4.41 3.59 8 8 8s8-3.59 8-8-3.59-8-8-8-8 3.59-8 8"
      clipRule="evenodd"
    />
  </svg>
);

export default AddCircleIcon;