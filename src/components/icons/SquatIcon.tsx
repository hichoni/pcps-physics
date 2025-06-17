import type React from 'react';

export const SquatIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v5"/>
    <path d="M9 12l-2 5h10l-2-5"/>
    <path d="M7 17l-2 4"/>
    <path d="M17 17l2 4"/>
  </svg>
);
