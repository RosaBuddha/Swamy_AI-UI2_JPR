import * as React from "react";

const NewTaskIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      d="M8 1.333a6.01 6.01 0 0 0-6 6c0 3.306 2.694 6 6 6v2.062l1.026-.658c1.49-.956 4.209-3.02 4.84-6.148A6 6 0 0 0 14 7.333c0-3.305-2.694-6-6-6m0 1.334a4.657 4.657 0 0 1 4.561 5.648l-.001.005-.001.004c-.396 1.966-1.911 3.413-3.226 4.435v-.893l-.75.094q-.3.039-.583.04a4.657 4.657 0 0 1-4.667-4.667A4.657 4.657 0 0 1 8 2.667"
    />
    <path fill="currentColor" d="M10.333 7.667h-2v2h-.666v-2h-2V7h2V5h.666v2h2z" />
    <path fill="currentColor" d="M8.667 4.667v2h2V8h-2v2H7.333V8h-2V6.667h2v-2z" />
  </svg>
);

export default NewTaskIcon;