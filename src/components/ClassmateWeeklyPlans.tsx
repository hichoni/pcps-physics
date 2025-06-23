
'use client';

import React, { useMemo, useState } from 'react';
import type { Student, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Users, Waves, Eye } from 'lucide-react';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ClassmateData = Student & {
  dailyGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }>;
  weeklyLikes: Record<string, string[]>;
};

interface ClassmateWeeklyPlansProps {
  classmatesData: ClassmateData[];
  currentStudentId: string;
  availableExercises: ExerciseType[];
  onLikePlan: (targetStudentId: string) => void;
  isLoading: boolean;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const ClassmateWeeklyPlans: React.FC<ClassmateWeeklyPlansProps> = ({
  classmatesData,
  currentStudentId,
  availableExercises,
  onLikePlan,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const weekKey = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), []);
  const weekDates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  const otherClassmates = classmatesData.filter(c => c.id !== currentStudentId);

  if (isLoading) {
    return null; // Don't show anything while loading, parent shows a loader
  }

  if (otherClassmates.length === 0) {
    return null; // Don't render the component if there are no other classmates
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center font-headline text-xl">
          <Users className="mr-3 h-7 w-7 text-sky-500" />
          우리반 친구들 계획 구경하기
        </CardTitle>
        <CardDescription>
          친구들의 주간 계획을 보고 '좋아요'로 응원해주세요!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Eye className="mr-2 h-5 w-5" />
              친구들 주간 계획 보기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-2xl font-headline">우리반 친구들 주간 계획</DialogTitle>
              <DialogDescription>
                친구들이 세운 이번 주 운동 목표입니다. 하트를 눌러 응원해주세요.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sticky left-0 bg-card z-10 font-semibold">친구</TableHead>
                    {weekDates.map(date => (
                      <TableHead key={date.toISOString()} className={cn("text-center min-w-[140px]", isToday(date) && "text-primary font-bold")}>
                        {format(date, 'M/d (E)', { locale: ko })}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherClassmates.map(classmate => {
                    const likesForWeek = classmate.weeklyLikes?.[weekKey] || [];
                    const likeCount = likesForWeek.length;
                    const hasLiked = likesForWeek.includes(currentStudentId);
                    const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === classmate.avatarSeed)?.icon;

                    return (
                      <TableRow key={classmate.id} className="group">
                        <TableCell className="sticky left-0 bg-card z-10 font-medium group-hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8 border">
                                {SelectedAvatarIcon ? <SelectedAvatarIcon className="h-full w-full p-1 text-primary" /> : <AvatarFallback className="text-xs">{getInitials(classmate.name)}</AvatarFallback>}
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{classmate.name}</p>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onLikePlan(classmate.id); }} className="h-auto p-1 -ml-1 text-xs text-muted-foreground">
                                    <Heart className={cn("h-4 w-4 mr-1", hasLiked && "fill-red-500 text-red-500")} />
                                    {likeCount > 0 ? likeCount : ''}
                                </Button>
                            </div>
                          </div>
                        </TableCell>
                        {weekDates.map(date => {
                          const dateKey = format(date, 'yyyy-MM-dd');
                          const dayGoals = classmate.dailyGoals?.[dateKey];
                          
                          if (!dayGoals) {
                            return <TableCell key={dateKey} className="text-center text-muted-foreground/50 group-hover:bg-muted/50">-</TableCell>;
                          }
                          
                          const goalItems = availableExercises
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
                            });
                          
                          const isRestDay = availableExercises.length > 0 && availableExercises.every(ex => dayGoals.skipped.has(ex.id)) && goalItems.length === 0;

                          if (isRestDay) {
                            return (
                                <TableCell key={dateKey} className="text-center text-blue-500 group-hover:bg-muted/50">
                                  <div className="flex items-center justify-center gap-2">
                                    <Waves className="h-4 w-4" /> <span>휴식</span>
                                  </div>
                                </TableCell>
                            );
                          }
                          
                          if (goalItems.length === 0) {
                            return <TableCell key={dateKey} className="text-center text-muted-foreground/50 group-hover:bg-muted/50">-</TableCell>;
                          }

                          return (
                            <TableCell key={dateKey} className="group-hover:bg-muted/50">
                               <TooltipProvider>
                                <ul className="space-y-1.5 text-xs">
                                  {goalItems.map(item => (
                                    <Tooltip key={item.key}>
                                        <TooltipTrigger asChild>
                                            <li className="flex items-center gap-1.5 cursor-default">
                                                <item.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="font-semibold whitespace-nowrap">{`${item.value}${item.unit}`}</span>
                                            </li>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{item.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </ul>
                              </TooltipProvider>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ClassmateWeeklyPlans;
