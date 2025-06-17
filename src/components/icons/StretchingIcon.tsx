import type React from 'react';

export const StretchingIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
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
    <path d="M16.473 18.078c.39.648.441 1.527.104 2.208a2.613 2.613 0 01-3.918 1.145l-1.32-1.008a1.426 1.426 0 00-1.903.21l-1.012 1.247a1.426 1.426 0 01-2.192-.008L5.08 20.74a1.426 1.426 0 010-2.27l.975-.975a1.426 1.426 0 000-2.016L4.04 13.464a1.426 1.426 0 010-2.016l1.768-1.768a1.426 1.426 0 012.016 0l1.768 1.768a1.426 1.426 0 002.016 0l1.768-1.768a1.426 1.426 0 012.016 0l2.828 2.828a1.426 1.426 0 010 2.016l-1.768 1.768a1.426 1.426 0 000 2.016l1.012 1.012" />
    <path d="M18 6L22 2" />
    <circle cx="6" cy="6" r="3" />
  </svg>
);
