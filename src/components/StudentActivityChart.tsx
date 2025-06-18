
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RecordedExercise, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isToday,
  parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, Flag, Star, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { getIconByName } from '@/lib/iconMap';

interface StudentActivityChartProps {
  logs: RecordedExercise[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal;
  availableExercises: ExerciseType[];
}

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ logs, timeFrame, studentGoals, availableExercises }) => {
  const today = new Date();

  const filteredLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    if (timeFrame === 'today') {
      return isToday(logDate);
    }
    if (timeFrame === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
    }
    if (timeFrame === 'month') {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      return isWithinInterval(logDate, { start: monthStart, end: monthEnd });
    }
    return false;
  });

  if (availableExercises.length === 0) {
    return (
      <div className="min-h-[150px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
        <p>표시할 운동 목록이 없습니다.</p>
        <p className="text-xs">교사 페이지에서 운동을 먼저 설정해주세요.</p>
      </div>
    );
  }

  const exerciseSummaries = availableExercises.map((exercise: ExerciseType) => {
    const logsForThisExercise = filteredLogs.filter(log => log.exerciseId === exercise.id);
    let totalAchievedValue = 0;
    let goalValue: number | undefined = undefined;
    let unit = '';
    let progress = 0;

    if (exercise.category === 'count_time') {
      const totalCount = logsForThisExercise.reduce((sum, log) => sum + (log.countValue || 0), 0);
      const totalTime = logsForThisExercise.reduce((sum, log) => sum + (log.timeValue || 0), 0);

      if (studentGoals[exercise.id]?.count && exercise.countUnit) {
        totalAchievedValue = totalCount;
        unit = exercise.countUnit;
        goalValue = studentGoals[exercise.id]?.count;
      } else if (studentGoals[exercise.id]?.time && exercise.timeUnit) {
        totalAchievedValue = totalTime;
        unit = exercise.timeUnit;
        goalValue = studentGoals[exercise.id]?.time;
      } else {
        if (totalCount > 0 && exercise.countUnit) {
            totalAchievedValue = totalCount;
            unit = exercise.countUnit;
        } else if (totalTime > 0 && exercise.timeUnit) {
            totalAchievedValue = totalTime;
            unit = exercise.timeUnit;
        } else {
             totalAchievedValue = 0;
             unit = exercise.countUnit || exercise.timeUnit || '';
        }
      }
    } else if (exercise.category === 'steps_distance') {
      const totalSteps = logsForThisExercise.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
      const totalDistance = logsForThisExercise.reduce((sum, log) => sum + (log.distanceValue || 0), 0);

      if (studentGoals[exercise.id]?.steps && exercise.stepsUnit) {
        totalAchievedValue = totalSteps;
        unit = exercise.stepsUnit;
        goalValue = studentGoals[exercise.id]?.steps;
      } else if (studentGoals[exercise.id]?.distance && exercise.distanceUnit) {
        totalAchievedValue = totalDistance;
        unit = exercise.distanceUnit;
        goalValue = studentGoals[exercise.id]?.distance;
      } else {
         if (totalSteps > 0 && exercise.stepsUnit) {
            totalAchievedValue = totalSteps;
            unit = exercise.stepsUnit;
        } else if (totalDistance > 0 && exercise.distanceUnit) {
            totalAchievedValue = totalDistance;
            unit = exercise.distanceUnit;
        } else {
            totalAchievedValue = 0;
            unit = exercise.stepsUnit || exercise.distanceUnit || '';
        }
      }
    }

    if (goalValue && goalValue > 0) {
      progress = Math.min(100, Math.round((totalAchievedValue / goalValue) * 100));
    } else if (totalAchievedValue > 0) {
      progress = 0;
    }

    const IconComponent = getIconByName(exercise.iconName);
    const goalDisplay = goalValue ? `${goalValue.toLocaleString()}${unit}` : "목표 없음";
    const achievedDisplay = `${totalAchievedValue.toLocaleString()}${unit}`;

    return {
      id: exercise.id,
      name: exercise.koreanName,
      IconComponent: IconComponent,
      achievedValue: totalAchievedValue,
      achievedDisplay,
      unit: unit,
      color: `hsl(var(--chart-${(availableExercises.findIndex(e => e.id === exercise.id) % 5) + 1}))`,
      goalDisplay,
      hasGoal: !!goalValue && goalValue > 0,
      isAchieved: !!goalValue && goalValue > 0 && totalAchievedValue >= goalValue,
      progress,
    };
  });

  if (filteredLogs.length === 0 && !exerciseSummaries.some(s => s.hasGoal)) {
    return (
      <div className="min-h-[150px] flex items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        선택된 기간에 기록된 운동 데이터가 없으며, 설정된 목표도 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4"> {/* Max 3 cols for better visibility */}
      {exerciseSummaries.map(summary => {
        const IconComp = summary.IconComponent;
        return (
          <Card key={summary.id} className="shadow-sm rounded-xl hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium text-muted-foreground flex items-center">
                  {IconComp && <IconComp className="h-5 w-5 mr-2" style={{ color: summary.color }} />}
                  {!IconComp && <Star className="h-5 w-5 mr-2" style={{ color: summary.color }} />} {/* Fallback icon */}
                  {summary.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {summary.hasGoal ? (
                    <>
                      <Target className="inline-block h-3 w-3 mr-1 text-accent" /> 목표: {summary.goalDisplay}
                    </>
                  ) : (
                    <TrendingUp className="inline-block h-3 w-3 mr-1 opacity-50" /> 목표 없음
                  )}
                </CardDescription>
              </div>
              {summary.isAchieved && <Flag className="h-5 w-5 text-green-500" />}
              {!summary.isAchieved && summary.hasGoal && summary.achievedValue > 0 && <Star className="h-5 w-5 text-yellow-400" />}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div>
                <div className="text-3xl font-bold" style={{ color: summary.color }}>
                  {summary.achievedDisplay}
                </div>
                {summary.hasGoal && (
                  <p className="text-xs text-muted-foreground mt-1">
                    달성도: {summary.progress}%
                  </p>
                )}
              </div>
              {summary.hasGoal && (
                <Progress value={summary.progress} indicatorClassName={cn("transition-all duration-500 ease-out", summary.isAchieved ? "bg-green-500" : "")} className="h-2 mt-2" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentActivityChart;
    
