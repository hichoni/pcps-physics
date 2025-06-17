
'use client';

import React from 'react';
import { Target } from 'lucide-react';
import type { Gender } from '@/lib/types';

interface StudentHeaderProps {
  studentName: string; // Changed from studentNameBase
  gender: Gender;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentName, gender }) => {
  // Compliment logic is now handled in student/page.tsx
  const titleText = `${studentName}의 운동기록장`;

  const headerBgClass = gender === 'male' 
    ? 'bg-primary text-primary-foreground' 
    : 'bg-[#E6E6FA] text-slate-700'; 

  return (
    <header className={`p-4 shadow-md sticky top-0 z-50 ${headerBgClass}`}>
      <div className="container mx-auto flex items-center gap-3">
        <Target className="h-8 w-8" /> 
        <h1 className="text-xl sm:text-2xl font-bold font-headline truncate" title={titleText}>
          {titleText}
        </h1>
      </div>
    </header>
  );
};

export default StudentHeader;
    
