
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Exercise } from '@/lib/types';
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

interface StudentActivityChartProps {
  logs: RecordedExercise[];
  timeFrame: 'today' | 'week' | 'month';
}

// Define a simple color mapping if not using full chartConfig for recharts
const exerciseColors: Record<string, string> = {
  'ex1': 'hsl(var(--chart-1))', // Squat - Blue
  'ex2': 'hsl(var(--chart-2))', // Plank - Green
  'ex3': 'hsl(var(--chart-3))', // Walk/Run - Yellow
  'ex4': 'hsl(var(--chart-4))', // Jump Rope - Lighter Blue
};

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ logs, timeFrame }) => {
  const today = new Date();

  const filteredLogs = logs.filter(log => {
    const logDate = parseISO(log.date); // Ensure log.date is in "yyyy-MM-dd" or ISO format
    if (timeFrame === 'today') {
      return isToday(logDate);
    }
    if (timeFrame === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
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
    let totalValue = 0;
    let unit = '';

    switch (exercise.id) {
      case 'ex1': // 스쿼트 (횟수)
        totalValue = logsForThisExercise.reduce((sum, log) => sum + (log.countValue || 0), 0);
        unit = exercise.countUnit || '회';
        break;
      case 'ex2': // 플랭크 (시간)
        totalValue = logsForThisExercise.reduce((sum, log) => sum + (log.timeValue || 0), 0);
        unit = exercise.timeUnit || '초';
        break;
      case 'ex3': // 걷기/달리기 (거리)
        totalValue = logsForThisExercise.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
        unit = exercise.distanceUnit || 'm';
        break;
      case 'ex4': // 줄넘기 (횟수)
        totalValue = logsForThisExercise.reduce((sum, log) => sum + (log.countValue || 0), 0);
        unit = exercise.countUnit || '회';
        break;
      default:
        totalValue = 0;
        unit = '';
    }
    
    const IconComponent = exercise.icon;

    return {
      id: exercise.id,
      name: exercise.koreanName,
      IconComponent: IconComponent,
      value: totalValue,
      unit: unit,
      color: exerciseColors[exercise.id] || 'hsl(var(--foreground))',
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
          <Card key={summary.id} className="shadow-sm rounded-xl hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {summary.name}
              </CardTitle>
              <IconComp className="h-5 w-5" style={{ color: summary.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: summary.color }}>
                {summary.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.unit}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentActivityChart;
