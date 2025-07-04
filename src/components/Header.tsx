
import React from 'react';
import { School } from 'lucide-react'; // Using School icon from lucide-react
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <School className="h-8 w-8" /> {/* School icon */}
          <h1 className="text-2xl font-bold font-headline">풍풍이의 운동기록장</h1>
        </div>
        <Link href="/student" className="text-sm hover:underline">
          학생용 앱으로 이동 &rarr;
        </Link>
      </div>
    </header>
  );
};

export default Header;
