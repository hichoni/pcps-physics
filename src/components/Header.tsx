import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <LogoIcon className="h-8 w-8" />
        <h1 className="text-2xl font-bold font-headline">PhysEd Pal</h1>
      </div>
    </header>
  );
};

export default Header;
