'use client';

import React, { useMemo } from 'react';
import type { Student, CustomExercise as CustomExerciseType, StudentGoal } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle as UICardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Waves, X } from 'lucide-react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getIconByName } from '@/lib/iconMap';
import { cn } from '@/lib/utils';

interface StudentWeeklyPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  studentWeeklyGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }>;
  availableExercises: CustomExerciseType[];
}

const StudentWeeklyPlanDialog: React.FC<StudentWeeklyPlanDialogProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  studentWeeklyGoals, 
  availableExercises 
}) => {
  const weekDates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  if (!isOpen || !student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline">
            {student.name} 학생의 주간 계획
          </DialogTitle>
          <DialogDescription>
            선택된 학생의 이번 주 운동 목표입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 border-y max-h-[70vh] overflow-y-auto">
          {weekDates.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayGoals = studentWeeklyGoals?.[dateKey];
            const isCurrentDay = isToday(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const goalItems = dayGoals?.goals ? availableExercises
              .filter(exercise => !dayGoals.skipped.has(exercise.id))
              .flatMap(exercise => {
                const goal = dayGoals.goals[exercise.id];
                if (!goal) return [];
                
                const IconComp = getIconByName(exercise.iconName);
                const items: {key: string, name: string, value: number, unit: string, Icon: React.ElementType}[] = [];

                if (exercise.category === 'count_time') {
                  if ((goal.count ?? 0) > 0 && exercise.countUnit) {
                    items.push({ key: `${exercise.id}-count`, name: exercise.koreanName, value: goal.count!, unit: exercise.countUnit, Icon: IconComp });
                  }
                  if ((goal.time ?? 0) > 0 && exercise.timeUnit) {
                    items.push({ key: `${exercise.id}-time`, name: exercise.koreanName, value: goal.time!, unit: exercise.timeUnit, Icon: IconComp });
                  }
                } else if (exercise.category === 'steps_distance') {
                  if ((goal.steps ?? 0) > 0 && exercise.stepsUnit) {
                    items.push({ key: `${exercise.id}-steps`, name: exercise.koreanName, value: goal.steps!, unit: exercise.stepsUnit, Icon: IconComp });
                  }
                }
                return items;
              }) : [];

            const isRestDay = dayGoals && availableExercises.length > 0 && availableExercises.every(ex => dayGoals.skipped.has(ex.id)) && goalItems.length === 0;

            return (
              <Card key={dateKey} className={cn("flex flex-col", isCurrentDay ? "ring-2 ring-primary border-primary" : (isWeekend ? "border-red-200 dark:border-red-800/70" : ""))}>
                <CardHeader className="p-3">
                  <UICardTitle className={cn("text-base font-semibold", isWeekend && !isCurrentDay && "text-red-600 dark:text-red-400")}>
                    {format(date, 'M/d (E)', { locale: ko })}
                  </UICardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex-grow flex flex-col justify-center">
                  {isRestDay ? (
                    <div className="flex flex-col items-center justify-center text-center text-blue-500 h-full">
                      <Waves className="h-6 w-6 mb-1" />
                      <span className="font-semibold">휴식</span>
                    </div>
                  ) : goalItems.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {goalItems.map(item => (
                         <li key={item.key} className="flex items-center justify-between gap-2" title={`${item.name}: ${item.value}${item.unit}`}>
                            <div className="flex items-center gap-2 truncate">
                               <item.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                               <span className="truncate">{item.name}</span>
                            </div>
                            <span className="font-semibold whitespace-nowrap">{item.value}{item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <span className="text-muted-foreground">-</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg"><X className="mr-2 h-5 w-5" /> 닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentWeeklyPlanDialog;
