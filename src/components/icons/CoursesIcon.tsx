import type { SVGProps } from 'react';

export function CoursesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
      <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
      <path d="M8 4v17" />
    </svg>
  );
}
