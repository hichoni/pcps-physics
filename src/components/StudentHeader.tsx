
'use client';

import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import type { Gender } from '@/lib/types';

const POSITIVE_ADJECTIVES_KR = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];

interface StudentHeaderProps {
  studentNameBase: string;
  gender: Gender;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentNameBase, gender }) => {
  const [displayStudentName, setDisplayStudentName] = useState(studentNameBase);

  useEffect(() => {
    const dayOfMonth = new Date().getDate();
    const adjectiveIndex = (dayOfMonth - 1) % POSITIVE_ADJECTIVES_KR.length;
    const selectedAdjective = POSITIVE_ADJECTIVES_KR[adjectiveIndex];
    setDisplayStudentName(`${selectedAdjective} ${studentNameBase}`);
  }, [studentNameBase]); // studentNameBase가 바뀔 때마다 수식어 다시 생성

  const headerBgClass = gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-[#E6E6FA] text-slate-700'; // 여학생: Lavender 배경, 어두운 글씨

  return (
    <header className={`p-4 shadow-md sticky top-0 z-50 ${headerBgClass}`}>
      <div className="container mx-auto flex items-center gap-3">
        <Target className="h-8 w-8" /> 
        <h1 className="text-xl sm:text-2xl font-bold font-headline truncate" title={displayStudentName}>
          {displayStudentName}
        </h1>
      </div>
    </header>
  );
};

export default StudentHeader;
