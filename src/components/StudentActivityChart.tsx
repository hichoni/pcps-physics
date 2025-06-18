
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RecordedExercise, Exercise, StudentGoal } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
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
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';


interface StudentActivityChartProps {
  logs: RecordedExercise[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal; // 학생 목표 데이터 추가
}

const exerciseColors: Record<string, string> = {
  'ex1': 'hsl(var(--chart-1))', 
  'ex2': 'hsl(var(--chart-2))', 
  'ex3': 'hsl(var(--chart-3))', 
  'ex4': 'hsl(var(--chart-4))', 
};

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ logs, timeFrame, studentGoals }) => {
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

  const exerciseSummaries = EXERCISES.map((exercise: Exercise) => {
    const logsForThisExercise = filteredLogs.filter(log => log.exerciseId === exercise.id);
    let totalAchievedValue = 0;
    let goalValue: number | undefined = undefined;
    let unit = '';
    let progressText = '';

    if (exercise.category === 'count_time') {
      totalAchievedValue = logsForThisExercise.reduce((sum, log) => sum + ((log.countValue || 0) || (log.timeValue || 0)), 0); // 주 단위 우선
      unit = exercise.countUnit || exercise.timeUnit || '';
      goalValue = studentGoals[exercise.id]?.count ?? studentGoals[exercise.id]?.time;
      if (goalValue && unit) {
         const percent = goalValue > 0 ? Math.min(100, Math.round((totalAchievedValue / goalValue) * 100)) : (totalAchievedValue > 0 ? 100 : 0);
         progressText = `목표: ${goalValue}${unit} (${percent}%)`;
      }
    } else if (exercise.category === 'steps_distance') {
      totalAchievedValue = logsForThisExercise.reduce((sum, log) => sum + ((log.stepsValue || 0) || (log.distanceValue || 0)), 0); // 주 단위 우선
      unit = exercise.stepsUnit || exercise.distanceUnit || '';
      goalValue = studentGoals[exercise.id]?.steps ?? studentGoals[exercise.id]?.distance;
       if (goalValue && unit) {
         const percent = goalValue > 0 ? Math.min(100, Math.round((totalAchievedValue / goalValue) * 100)) : (totalAchievedValue > 0 ? 100 : 0);
         progressText = `목표: ${goalValue}${unit} (${percent}%)`;
      }
    }
    
    const IconComponent = exercise.icon;

    return {
      id: exercise.id,
      name: exercise.koreanName,
      IconComponent: IconComponent,
      achievedValue: totalAchievedValue,
      unit: unit,
      color: exerciseColors[exercise.id] || 'hsl(var(--foreground))',
      goalText: progressText || (goalValue ? `목표: ${goalValue}${unit}` : "목표 없음"),
      hasGoal: !!goalValue,
      isAchieved: goalValue !== undefined && totalAchievedValue >= goalValue,
    };
  });

  if (filteredLogs.length === 0) {
    return (
      <div className="min-h-[150px] flex items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        선택된 기간에 기록된 운동 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
      {exerciseSummaries.map(summary => {
        const IconComp = summary.IconComponent;
        return (
          <Card key={summary.id} className="shadow-sm rounded-xl hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {summary.name}
              </CardTitle>
              <IconComp className="h-5 w-5" style={{ color: summary.color }} />
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-3xl font-bold" style={{ color: summary.color }}>
                {summary.achievedValue.toLocaleString()}
                <span className="text-xl ml-1">{summary.unit}</span>
              </div>
              <p className={cn("text-xs mt-1", summary.hasGoal ? "text-accent" : "text-muted-foreground/70")}>
                {summary.hasGoal ? (
                    <Target className="inline-block h-3 w-3 mr-1" />
                ) : (
                    <TrendingUp className="inline-block h-3 w-3 mr-1 opacity-50" />
                )}
                {summary.goalText}
                {summary.isAchieved && <CheckCircle2 className="inline-block h-3.5 w-3.5 ml-1.5 text-green-500" />}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentActivityChart;
