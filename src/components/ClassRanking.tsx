
'use client';

import React from 'react';
import type { Student, RecordedExercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Medal, Trophy, Flame } from 'lucide-react';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { parseISO, differenceInCalendarDays, subDays } from 'date-fns';

interface ClassRankingProps {
  students: Student[];
  logs: RecordedExercise[];
  currentStudentId: string;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

// Helper function to calculate streak
const calculateStreak = (studentId: string, allLogs: RecordedExercise[]): number => {
    const studentLogs = allLogs.filter(log => log.studentId === studentId);
    if (studentLogs.length === 0) return 0;

    const uniqueDates = [...new Set(studentLogs.map(log => log.date))];
    const sortedDates = uniqueDates.map(d => parseISO(d)).sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    
    // If last log is not today or yesterday, streak is broken
    if (differenceInCalendarDays(today, sortedDates[0]) > 1) {
        return 0;
    }

    let streak = 1;
    let currentDate = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
        const previousDate = sortedDates[i];
        if (differenceInCalendarDays(currentDate, previousDate) === 1) {
            streak++;
            currentDate = previousDate;
        } else if (differenceInCalendarDays(currentDate, previousDate) > 1) {
            // Gap found, stop counting
            break;
        }
        // If dates are the same, just continue
    }
    
    return streak;
};


const ClassRanking: React.FC<ClassRankingProps> = ({ students, logs, currentStudentId }) => {
  const rankedStudents = students
    .map(student => ({
      ...student,
      streak: calculateStreak(student.id, logs),
    }))
    .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0) || a.studentNumber - b.studentNumber);

  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
    return <span className="text-sm font-semibold w-6 text-center">{rank}</span>;
  };
  
  if (students.length <= 1) {
    return null; // Don't show ranking if there's only one student or none
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center font-headline text-xl">
          <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
          우리반 명예의 전당
        </CardTitle>
        <CardDescription>
          XP를 모아 랭킹을 올리고, 연속 운동 기록에 도전해보세요!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {rankedStudents.map((student, index) => {
            const rank = index + 1;
            const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed)?.icon;
            
            return (
              <li
                key={student.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all",
                  student.id === currentStudentId 
                    ? "bg-primary/10 border-primary shadow-md"
                    : "bg-background/50 hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getMedal(rank)}
                </div>
                
                <Avatar className="h-10 w-10 border-2">
                   {SelectedAvatarIcon ? (
                     <SelectedAvatarIcon className="h-full w-full text-primary p-1" />
                   ) : (
                     <AvatarFallback className="text-sm bg-muted">
                       {getInitials(student.name)}
                     </AvatarFallback>
                   )}
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(student.totalXp || 0).toLocaleString()} XP
                  </p>
                </div>
                
                {student.streak > 0 && (
                  <div className="flex items-center gap-1 text-sm text-orange-500 font-semibold">
                    <Flame className="h-4 w-4" />
                    <span>{student.streak}일 연속!</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ClassRanking;
