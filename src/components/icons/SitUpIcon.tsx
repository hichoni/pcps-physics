import type React from 'react';

export const SitUpIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
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
    <path d="M2 16l2.194-6.412A2 2 0 0 1 6.012 8H7.5a2.5 2.5 0 0 1 2.5 2.5V16" />
    <path d="M6.23 11.44c.88.22 1.74.58 2.52.96" />
    <path d="M12.42 15.5H19a2 2 0 0 0 2-2V9.5a2.5 2.5 0 0 0-2.5-2.5H17" />
    <path d="M15 16l-2-4" />
    <circle cx="6" cy="5" r="2" />
    <path d="M20 20l-2-4h-4l-2 4" />
  </svg>
);
