
'use client';

import React, { useMemo } from 'react';
import type { Student, Exercise, StudentGoal } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Heart, Users } from 'lucide-react';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';
import { format, startOfWeek, addDays } from 'date-fns';

type ClassmateData = Student & {
  dailyGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }>;
  weeklyLikes: Record<string, string[]>;
};

interface ClassmateWeeklyPlansProps {
  classmatesData: ClassmateData[];
  currentStudentId: string;
  availableExercises: Exercise[];
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

const ClassmatePlanCard: React.FC<{
  classmate: ClassmateData,
  isLiked: boolean,
  likeCount: number,
  onLike: () => void,
  availableExercises: Exercise[],
}> = ({ classmate, isLiked, likeCount, onLike, availableExercises }) => {
  const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === classmate.avatarSeed)?.icon;

  const plannedExercises = useMemo(() => {
    const exercises = new Map<string, Exercise>();
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayGoalsData = classmate.dailyGoals?.[dateKey];
      if (dayGoalsData) {
        Object.keys(dayGoalsData.goals).forEach(exId => {
          if (!dayGoalsData.skipped.has(exId)) {
            const exerciseDetail = availableExercises.find(ex => ex.id === exId);
            if (exerciseDetail) {
              exercises.set(exId, exerciseDetail);
            }
          }
        });
      }
    }
    return Array.from(exercises.values());
  }, [classmate.dailyGoals, availableExercises]);

  return (
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <Avatar className="h-10 w-10 border">
          {SelectedAvatarIcon ? <SelectedAvatarIcon className="h-full w-full p-1.5 text-primary" /> : <AvatarFallback>{getInitials(classmate.name)}</AvatarFallback>}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base">{classmate.name}</CardTitle>
          <CardDescription>{(classmate.totalXp || 0).toLocaleString()} XP</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2">
        <p className="text-xs text-muted-foreground mb-2">이번 주 목표</p>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {plannedExercises.length > 0 ? plannedExercises.map(ex => {
            const Icon = getIconByName(ex.iconName);
            return <div key={ex.id} className="flex items-center gap-1.5 p-1.5 bg-secondary/50 rounded-md text-xs" title={ex.koreanName}><Icon className="h-3.5 w-3.5" /> <span>{ex.koreanName}</span></div>
          }) : <p className="text-xs text-muted-foreground self-center">설정된 목표가 없어요.</p>}
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-slate-50 dark:bg-slate-800/30">
        <Button variant="ghost" size="sm" onClick={onLike} className="w-full">
          <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-red-500 text-red-500")} />
          좋아요 {likeCount > 0 && `(${likeCount})`}
        </Button>
      </CardFooter>
    </Card>
  );
};


const ClassmateWeeklyPlans: React.FC<ClassmateWeeklyPlansProps> = ({
  classmatesData,
  currentStudentId,
  availableExercises,
  onLikePlan,
  isLoading
}) => {
  const weekKey = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), []);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {otherClassmates.map(classmate => {
            const likesForWeek = classmate.weeklyLikes?.[weekKey] || [];
            const likeCount = likesForWeek.length;
            const hasLiked = likesForWeek.includes(currentStudentId);

            return (
              <ClassmatePlanCard
                key={classmate.id}
                classmate={classmate}
                isLiked={hasLiked}
                likeCount={likeCount}
                onLike={() => onLikePlan(classmate.id)}
                availableExercises={availableExercises}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassmateWeeklyPlans;
