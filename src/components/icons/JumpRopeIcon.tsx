import type React from 'react';

export const JumpRopeIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
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
    <path d="M7.5 7.5a5.5 5.5 0 0 1 9 0"/>
    <path d="M5 20A7 7 0 0 1 12 15a7 7 0 0 1 7 5"/>
    <circle cx="12" cy="7" r="1"/>
    <path d="M12 8v4"/>
    <path d="M10 14l2-2 2 2"/>
  </svg>
);
