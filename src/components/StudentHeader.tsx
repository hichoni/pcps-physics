
import React from 'react';
import { Target } from 'lucide-react'; // Using a different icon for student app

interface StudentHeaderProps {
  studentName: string; // 이제 string 전체를 받음
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentName }) => {
  return (
    <header className="bg-accent text-accent-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Target className="h-8 w-8" /> 
        <h1 className="text-xl sm:text-2xl font-bold font-headline truncate" title={studentName}>
          {studentName}
        </h1>
      </div>
    </header>
  );
};

export default StudentHeader;
