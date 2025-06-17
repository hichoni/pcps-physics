import type React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }> = (props) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L12 6" />
    <path d="M12 18L12 22" />
    <path d="M18.364 5.63604L15.5358 8.4642" />
    <path d="M8.46424 15.5358L5.63601 18.364" />
    <path d="M22 12L18 12" />
    <path d="M6 12L2 12" />
    <path d="M18.364 18.364L15.5358 15.5358" />
    <path d="M8.46424 8.4642L5.63601 5.63604" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
