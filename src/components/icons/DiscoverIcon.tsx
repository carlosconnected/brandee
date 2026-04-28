import type { SVGProps } from 'react';

export function DiscoverIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="m16 8-4 8-4-8 8 0z" transform="rotate(45 12 12)" />
    </svg>
  );
}
