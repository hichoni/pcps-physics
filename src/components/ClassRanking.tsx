
'use client';

import React from 'react';
import type { Student, RecordedExercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Medal, Trophy, Flame } from 'lucide-react';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { parseISO, differenceInCalendarDays } from 'date-fns';

interface ClassRankingProps {
  students: Student[];
  logs: RecordedExercise[];
  currentStudentId: string;
}

// A new type for internal use within this component
type StudentWithStreak = Student & { streak: number };

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const calculateStreak = (studentId: string, allLogs: RecordedExercise[]): number => {
    const studentLogs = allLogs.filter(log => log.studentId === studentId);
    if (studentLogs.length === 0) return 0;

    const uniqueDates = [...new Set(studentLogs.map(log => log.date))];
    const sortedDates = uniqueDates.map(d => parseISO(d)).sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    
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
            break;
        }
    }
    
    return streak;
};

const PodiumItem: React.FC<{ student: StudentWithStreak; rank: number; isCurrentUser: boolean }> = ({ student, rank, isCurrentUser }) => {
    const podiumStyles = {
        1: {
            height: 'h-48',
            borderColor: 'border-yellow-400',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            textColor: 'text-yellow-600 dark:text-yellow-400',
            icon: <Trophy className="h-8 w-8" />,
        },
        2: {
            height: 'h-40',
            borderColor: 'border-slate-400',
            bgColor: 'bg-slate-50 dark:bg-slate-800/20',
            textColor: 'text-slate-500 dark:text-slate-400',
            icon: <Medal className="h-7 w-7" />,
        },
        3: {
            height: 'h-36',
            borderColor: 'border-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            textColor: 'text-orange-500 dark:text-orange-400',
            icon: <Award className="h-6 w-6" />,
        },
    };

    const style = podiumStyles[rank as keyof typeof podiumStyles];
    const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed)?.icon;

    return (
        <div className={cn("flex flex-col items-center justify-end w-1/3", style.height)}>
            <div className={cn(style.textColor, "flex flex-col items-center")}>
                 {style.icon}
                 <span className="font-bold text-lg">{rank}</span>
            </div>
            <Avatar className="h-16 w-16 border-4 mt-1" style={{ borderColor: style.borderColor }}>
                {SelectedAvatarIcon ? (
                    <SelectedAvatarIcon className="h-full w-full p-2 text-primary" />
                ) : (
                    <AvatarFallback className="text-xl bg-muted">{getInitials(student.name)}</AvatarFallback>
                )}
            </Avatar>
            <p className={cn("font-bold text-sm mt-2 truncate max-w-full", isCurrentUser && "text-primary")}>{student.name}</p>
            <p className="text-xs text-muted-foreground">{(student.totalXp || 0).toLocaleString()} XP</p>
        </div>
    );
};


const ClassRanking: React.FC<ClassRankingProps> = ({ students, logs, currentStudentId }) => {
  const rankedStudents = students
    .map(student => ({
      ...student,
      streak: calculateStreak(student.id, logs),
    }))
    .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0) || a.studentNumber - b.studentNumber);

  if (students.length <= 1) {
    return null;
  }
  
  const topStudents = rankedStudents.slice(0, 8);
  const topThree = topStudents.slice(0, 3);
  const others = topStudents.slice(3);

  // Reorder for podium display (2nd, 1st, 3rd)
  const podiumOrder = [
      topThree.find((s, i) => i === 1),
      topThree.find((s, i) => i === 0),
      topThree.find((s, i) => i === 2)
  ].filter(Boolean) as StudentWithStreak[];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center font-headline text-xl">
          <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
          우리반 명예의 전당
        </CardTitle>
        <CardDescription>
          상위 8명의 학생들을 만나보세요! XP와 연속 운동으로 순위가 결정됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-2 border-b-2 border-border pb-4 mb-4">
                {podiumOrder.map((student, index) => {
                    // Original rank before reordering for display
                    let rank: number;
                    if (index === 0) rank = 2; // 2nd place
                    else if (index === 1) rank = 1; // 1st place
                    else rank = 3; // 3rd place
                    
                    return (
                        <PodiumItem 
                            key={student.id} 
                            student={student} 
                            rank={rank} 
                            isCurrentUser={student.id === currentStudentId}
                        />
                    );
                })}
            </div>
        )}

        {/* List for 4th to 8th */}
        {others.length > 0 && (
            <ul className="space-y-2">
            {others.map((student, index) => {
                const rank = index + 4;
                const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed)?.icon;
                
                return (
                <li
                    key={student.id}
                    className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border transition-all",
                    student.id === currentStudentId 
                        ? "bg-primary/10 border-primary"
                        : "bg-background/50 hover:bg-secondary/40"
                    )}
                >
                    <div className="flex items-center justify-center w-6 text-muted-foreground font-semibold">
                      {rank}
                    </div>
                    
                    <Avatar className="h-9 w-9 border">
                    {SelectedAvatarIcon ? (
                        <SelectedAvatarIcon className="h-full w-full text-primary p-1" />
                    ) : (
                        <AvatarFallback className="text-sm bg-muted">
                        {getInitials(student.name)}
                        </AvatarFallback>
                    )}
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(student.totalXp || 0).toLocaleString()} XP
                      </p>
                    </div>
                    
                    {student.streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                        <Flame className="h-3 w-3" />
                        <span>{student.streak}일</span>
                    </div>
                    )}
                </li>
                );
            })}
            </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassRanking;
