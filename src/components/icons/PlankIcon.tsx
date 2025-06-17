import type React from 'react';

export const PlankIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
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
    <circle cx="5" cy="5" r="1" />
    <path d="M5 6h12l2 2" /> 
    <path d="M10 10L8 12" /> 
    <path d="M3 15h18" /> 
  </svg>
);
