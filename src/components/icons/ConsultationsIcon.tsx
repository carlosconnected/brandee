import type { SVGProps } from 'react';

export function ConsultationsIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M3 11a9 9 0 0 1 18 0v5a3 3 0 0 1-3 3h-1v-7h4" />
      <path d="M21 11h-4v7h1a3 3 0 0 0 3-3" />
      <path d="M3 11h4v7H6a3 3 0 0 1-3-3z" />
    </svg>
  );
}
