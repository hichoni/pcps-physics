
'use client';

import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import type { Gender } from '@/lib/types';

const DEFAULT_POSITIVE_ADJECTIVES_KR = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];
const COMPLIMENTS_STORAGE_KEY = 'physEdPalCompliments_v1';

interface StudentHeaderProps {
  studentNameBase: string;
  gender: Gender;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentNameBase, gender }) => {
  const [displayStudentName, setDisplayStudentName] = useState(studentNameBase);
  const [adjectiveList, setAdjectiveList] = useState<string[]>(DEFAULT_POSITIVE_ADJECTIVES_KR);

  useEffect(() => {
    // Load compliments from localStorage on client side
    if (typeof window !== 'undefined') {
      const savedCompliments = localStorage.getItem(COMPLIMENTS_STORAGE_KEY);
      if (savedCompliments) {
        try {
          const parsedCompliments = JSON.parse(savedCompliments);
          if (Array.isArray(parsedCompliments) && parsedCompliments.length > 0) {
            setAdjectiveList(parsedCompliments);
          } else {
            setAdjectiveList(DEFAULT_POSITIVE_ADJECTIVES_KR); // Fallback if empty or invalid
          }
        } catch (e) {
          console.error("Failed to parse compliments from localStorage:", e);
          setAdjectiveList(DEFAULT_POSITIVE_ADJECTIVES_KR); // Fallback on error
        }
      } else {
         setAdjectiveList(DEFAULT_POSITIVE_ADJECTIVES_KR); // Fallback if not found
      }
    }
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    // This effect runs when adjectiveList or studentNameBase changes
    // It ensures that if localStorage updates, the displayed name might also update (if the list changes)
    // Or if the student changes, the name updates.
    if (adjectiveList.length > 0) {
      const dayOfMonth = new Date().getDate();
      // The adjective is chosen based on the day of the month.
      // This means on the same day, all students will see the same adjective.
      // If different adjectives per student on the same day are desired,
      // a more complex selection logic (e.g., incorporating student ID) would be needed.
      const adjectiveIndex = (dayOfMonth - 1 + studentNameBase.length) % adjectiveList.length; // Add studentNameBase.length for slight variation
      const selectedAdjective = adjectiveList[adjectiveIndex] || DEFAULT_POSITIVE_ADJECTIVES_KR[0];
      setDisplayStudentName(`${selectedAdjective} ${studentNameBase}`);
    } else {
      // Fallback if adjectiveList is somehow empty after loading attempts
      const dayOfMonth = new Date().getDate();
      const adjectiveIndex = (dayOfMonth - 1 + studentNameBase.length) % DEFAULT_POSITIVE_ADJECTIVES_KR.length;
      const selectedAdjective = DEFAULT_POSITIVE_ADJECTIVES_KR[adjectiveIndex];
      setDisplayStudentName(`${selectedAdjective} ${studentNameBase}`);
    }
  }, [studentNameBase, adjectiveList]);

  const headerBgClass = gender === 'male' 
    ? 'bg-primary text-primary-foreground' 
    : 'bg-[#E6E6FA] text-slate-700'; 

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
    