import type React from 'react';

export const JumpingJacksIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
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
    <path d="M12 2L14 8" />
    <path d="M12 2L10 8" />
    <path d="M12 10v4" />
    <path d="M12 14l-4 6" />
    <path d="M12 14l4 6" />
    <path d="M5 12l-3-2" />
    <path d="M19 12l3-2" />
    <circle cx="12" cy="4" r="1" />
  </svg>
);
