
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { getIconByName } from '@/lib/iconMap';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
// import { cn } from '@/lib/utils'; // Not strictly needed for this version

interface StudentActivityChartProps {
  logs: RecordedExercise[];
  students?: Student[]; 
  selectedStudent?: Student | null;
  availableExercises: ExerciseType[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal;
}

const generateChartColors = (exercises: ExerciseType[]): Record<string, { color: string }> => {
  return exercises.reduce((acc, ex, index) => {
    acc[ex.id] = { 
      color: `hsl(var(--chart-${(index % 5) + 1}))`
    };
    return acc;
  }, {} as Record<string, { color: string }>);
};

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ 
  logs, 
  students = [], 
  selectedStudent, 
  availableExercises, 
  timeFrame, 
  studentGoals 
}) => {

  if (!availableExercises || availableExercises.length === 0) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
        <p>표시할 운동 목록이 없습니다.</p>
        <p className="text-xs">교사 페이지에서 운동을 먼저 설정해주세요.</p>
      </div>
    );
  }
  
  const chartColors = generateChartColors(availableExercises);

  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  if (!relevantStudents || relevantStudents.length === 0) {
     return (
       <Card className="shadow-md rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="font-headline">운동 요약</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">표시할 학생 데이터가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }
  const relevantStudentIds = relevantStudents.map(s => s.id);

  const now = new Date();
  let interval: { start: Date, end: Date };
  if (timeFrame === 'today') {
    interval = { start: new Date(now.setHours(0,0,0,0)), end: new Date(new Date().setHours(23,59,59,999)) };
  } else if (timeFrame === 'week') {
    interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  } else { // month
    interval = { start: startOfMonth(now), end: endOfMonth(now) };
  }

  const logsForPeriod = logs.filter(log => {
    try {
        const logDate = parseISO(log.date);
        return relevantStudentIds.includes(log.studentId) && isWithinInterval(logDate, interval);
    } catch (e) {
        console.error("Error parsing log date:", log.date, e);
        return false;
    }
  });

  const exerciseSummaries = availableExercises.map(exercise => {
    const exerciseLogs = logsForPeriod.filter(log => log.exerciseId === exercise.id);
    const currentGoal = studentGoals[exercise.id];

    let achievedValue = 0;
    let goalValue: number | undefined = undefined;
    let unit = '';
    let hasGoal = false;

    if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
      achievedValue = exerciseLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
      unit = exercise.countUnit || '회';
      if (currentGoal?.count !== undefined) {
        goalValue = currentGoal.count;
        hasGoal = true;
      }
    } else if (exercise.id === 'plank') {
      achievedValue = exerciseLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);
      unit = exercise.timeUnit || '초';
      if (currentGoal?.time !== undefined) {
        goalValue = currentGoal.time;
        hasGoal = true;
      }
    } else if (exercise.id === 'walk_run') {
      achievedValue = exerciseLogs.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
      unit = exercise.distanceUnit || 'm';
      if (currentGoal?.distance !== undefined) {
        goalValue = currentGoal.distance;
        hasGoal = true;
      }
    }
    
    const percentage = goalValue !== undefined && goalValue > 0 
                       ? Math.min(100, Math.round((achievedValue / goalValue) * 100))
                       : (achievedValue > 0 ? 100 : 0);

    return {
      id: exercise.id,
      name: exercise.koreanName,
      IconComponent: getIconByName(exercise.iconName),
      achieved: achievedValue,
      goal: goalValue,
      unit: unit,
      percentage: percentage,
      hasGoal: hasGoal,
      color: chartColors[exercise.id]?.color || 'hsl(var(--primary))',
      hasActivity: achievedValue > 0,
    };
  });

  const noLogsForAllExercisesInPeriod = logsForPeriod.length === 0;
  const noEffectiveGoals = !Object.values(studentGoals).some(g => g && Object.values(g).some(val => val && val > 0));

  if (noLogsForAllExercisesInPeriod && noEffectiveGoals) {
     return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>선택된 기간에 기록된 운동이 없고,</p>
        <p>설정된 목표도 없습니다.</p>
         <p className="text-xs mt-2">운동을 기록하거나 목표를 설정해주세요.</p>
      </div>
    );
  }
  
  const relevantSummaries = exerciseSummaries.filter(s => s.hasGoal || s.hasActivity);

  if (relevantSummaries.length === 0 && !noLogsForAllExercisesInPeriod) {
     return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <TrendingUp className="h-8 w-8 mb-2" />
        <p>선택된 기간에 표시할 만한 활동이 없습니다.</p>
        <p className="text-xs mt-2">다른 기간을 선택하거나 운동을 기록해주세요.</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
      {exerciseSummaries.map(summary => {
        if (!summary.hasGoal && !summary.hasActivity) {
          return (
            <Card key={summary.id} className="shadow-sm rounded-xl flex flex-col justify-between bg-card/50 opacity-70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center text-muted-foreground">
                  <summary.IconComponent className="mr-2 h-5 w-5" />
                  {summary.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center text-center py-4">
                 <p className="text-xs text-muted-foreground">기록 또는 설정된 목표 없음</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={summary.id} className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-headline flex items-center text-primary">
                <summary.IconComponent className="mr-2 h-6 w-6" />
                {summary.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
              <div
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${summary.color} ${summary.percentage}%, hsl(var(--muted)) ${summary.percentage}%)`
                }}
              >
                <div className="absolute w-[calc(100%-24px)] h-[calc(100%-24px)] bg-card rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-3xl sm:text-4xl font-bold" style={{ color: summary.color }}>
                    {summary.percentage}%
                  </span>
                </div>
              </div>
              <div>
                {summary.hasGoal && summary.goal !== undefined ? (
                  <p className="text-sm text-foreground">
                    달성: {summary.achieved}{summary.unit} / 목표: {summary.goal}{summary.unit}
                  </p>
                ) : summary.hasActivity ? (
                  <p className="text-sm text-foreground">
                    활동: {summary.achieved}{summary.unit} (목표 미설정)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">활동 기록 없음</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentActivityChart;
