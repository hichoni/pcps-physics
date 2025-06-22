
'use client';

import React from 'react';
import type { RecordedExercise, Student, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIconByName } from '@/lib/iconMap';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

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
    interval = { start: new Date(new Date().setHours(0,0,0,0)), end: new Date(new Date().setHours(23,59,59,999)) };
  } else if (timeFrame === 'week') {
    interval = { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
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
    const currentGoal = studentGoals[exercise.id];
    const exerciseLogs = logsForPeriod.filter(log => log.exerciseId === exercise.id);

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
      achievedValue = exerciseLogs.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
      unit = exercise.stepsUnit || '걸음';
      if (currentGoal?.steps !== undefined) {
        goalValue = currentGoal.steps;
        hasGoal = true;
      }
    }
    
    const percentage = goalValue !== undefined && goalValue > 0 
                       ? Math.min(100, Math.round((achievedValue / goalValue) * 100))
                       : (achievedValue > 0 ? 100 : 0);

    const recentLogs = logs
        .filter(log => log.exerciseId === exercise.id && relevantStudentIds.includes(log.studentId))
        .slice(0, 3);

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
      recentLogs: recentLogs
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
  
  const relevantSummaries = exerciseSummaries.filter(s => s.hasGoal || s.hasActivity || s.recentLogs.length > 0);

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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-4">
      {availableExercises.map(exercise => {
        const summary = exerciseSummaries.find(s => s.id === exercise.id);
        if (!summary || (!summary.hasGoal && !summary.hasActivity && summary.recentLogs.length === 0 && timeFrame !== 'today')) {
           return null;
        }

        return (
          <Card key={summary.id} className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-headline flex items-center text-primary">
                <summary.IconComponent className="mr-2 h-6 w-6" />
                {summary.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between text-center space-y-3">
              {(summary.hasActivity || summary.hasGoal) ? (
                  <>
                    <div
                      className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center self-center"
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
                      {timeFrame === 'today' && summary.hasGoal && summary.goal !== undefined ? (
                        <p className="text-sm text-foreground">
                          달성: {summary.achieved}{summary.unit} / 목표: {summary.goal}{summary.unit}
                        </p>
                      ) : (
                        <p className="text-sm text-foreground">
                          활동량: {summary.achieved}{summary.unit}
                        </p>
                      )}
                    </div>
                  </>
              ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">기록 또는 설정된 목표 없음</p>
                </div>
              )}
               {summary.recentLogs.length > 0 && (
                <div className="text-xs text-left pt-2 border-t">
                  <h5 className="font-semibold mb-1 text-muted-foreground">최근 기록</h5>
                  <ul className="space-y-1">
                    {summary.recentLogs.map(log => {
                        let valueDisplay = "";
                        if (log.countValue) valueDisplay = `${log.countValue}${summary.unit}`;
                        else if (log.timeValue) valueDisplay = `${log.timeValue}${summary.unit}`;
                        else if (log.stepsValue) valueDisplay = `${log.stepsValue}${summary.unit}`;

                        return (
                            <li key={log.id} className="flex justify-between items-center text-muted-foreground">
                                <span>{format(parseISO(log.date), "MM/dd HH:mm")}</span>
                                <span className="font-medium text-foreground/80">{valueDisplay}</span>
                            </li>
                        )
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentActivityChart;
