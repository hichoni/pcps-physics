
'use client';

import React, { useMemo } from 'react';
import type { Student, CustomExercise as CustomExerciseType, StudentGoal } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Waves, CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getIconByName } from '@/lib/iconMap';
import { cn } from '@/lib/utils';

interface ClassWeeklyPlanProps {
  studentsInClass: Student[];
  allStudentDailyGoals: Record<string, Record<string, { goals: StudentGoal; skipped: Set<string> }>>;
  availableExercises: CustomExerciseType[];
  isLoading: boolean;
  selectedClass: string | undefined;
}

const ClassWeeklyPlan: React.FC<ClassWeeklyPlanProps> = ({ studentsInClass, allStudentDailyGoals, availableExercises, isLoading, selectedClass }) => {
  const weekDates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6"/>학급 주간 계획</CardTitle>
          <CardDescription>학생들의 주간 운동 목표를 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">주간 계획을 불러오는 중...</span>
        </CardContent>
      </Card>
    );
  }

  if (!selectedClass) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6"/>학급 주간 계획</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex justify-center items-center">
          <p className="text-muted-foreground">주간 계획을 보려면 학급을 선택해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  if (studentsInClass.length === 0) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6"/>{selectedClass} 주간 계획</CardTitle>
        </CardHeader>
        <CardContent className="h-40 flex justify-center items-center">
          <p className="text-muted-foreground">이 학급에 등록된 학생이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6"/>{selectedClass} 주간 계획</CardTitle>
        <CardDescription>학생들이 설정한 이번 주 운동 목표입니다. 실시간으로 업데이트됩니다.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] sticky left-0 bg-card z-10 font-semibold">학생</TableHead>
              {weekDates.map(date => (
                <TableHead key={date.toISOString()} className={cn("text-center min-w-[150px]", isToday(date) && "text-primary font-bold")}>
                  {format(date, 'M/d (E)', { locale: ko })}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsInClass.map(student => (
              <TableRow key={student.id}>
                <TableCell className="sticky left-0 bg-card z-10 font-medium">{student.studentNumber}번 {student.name}</TableCell>
                {weekDates.map(date => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const studentGoalsForDay = allStudentDailyGoals[student.id]?.[dateKey];
                  
                  if (!studentGoalsForDay) {
                    return <TableCell key={dateKey} className="text-center text-muted-foreground/50">-</TableCell>;
                  }

                  const { goals, skipped } = studentGoalsForDay;
                  
                  const goalItems = Object.entries(goals)
                    .filter(([exId]) => !skipped.has(exId))
                    .flatMap(([exId, goal]) => {
                      const exercise = availableExercises.find(ex => ex.id === exId);
                      if (!exercise) return [];
                      const IconComp = getIconByName(exercise.iconName);
                      const items: {key: string, text: string, Icon: React.ElementType}[] = [];
                      if (goal.count && exercise.countUnit) {
                        items.push({ key: `${exId}-count`, text: `${exercise.koreanName}: ${goal.count}${exercise.countUnit}`, Icon: IconComp });
                      }
                      if (goal.time && exercise.timeUnit) {
                        items.push({ key: `${exId}-time`, text: `${exercise.koreanName}: ${goal.time}${exercise.timeUnit}`, Icon: IconComp });
                      }
                      if (goal.steps && exercise.stepsUnit) {
                        items.push({ key: `${exId}-steps`, text: `${exercise.koreanName}: ${goal.steps}${exercise.stepsUnit}`, Icon: IconComp });
                      }
                      return items;
                    });
                  
                  if (goalItems.length === 0) {
                    const isRestDay = availableExercises.length > 0 && availableExercises.every(ex => skipped.has(ex.id));
                    if(isRestDay) {
                      return (
                        <TableCell key={dateKey} className="text-center text-blue-500">
                          <div className="flex items-center justify-center gap-2">
                            <Waves className="h-4 w-4" /> <span>휴식</span>
                          </div>
                        </TableCell>
                      );
                    }
                    return <TableCell key={dateKey} className="text-center text-muted-foreground/50">-</TableCell>;
                  }

                  return (
                    <TableCell key={dateKey}>
                      <ul className="space-y-1 text-xs">
                        {goalItems.map(item => (
                          <li key={item.key} className="flex items-center gap-1.5" title={`${item.text}`}>
                             <item.Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                             <span className="truncate">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClassWeeklyPlan;
