import * as React from "react";

interface SalesCanvasIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const SalesCanvasIcon: React.FC<SalesCanvasIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M21 1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2M1 5h2v16h16v2H3c-1.1 0-2-.9-2-2zm6 12h14V3H7z"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      d="M12.663 11.337 10 10l2.663-1.337L14 6l1.337 2.663L18 10l-2.663 1.337L14 14z"
    />
  </svg>
);

export default SalesCanvasIcon;