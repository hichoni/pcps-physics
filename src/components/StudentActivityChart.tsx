
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { getIconByName } from '@/lib/iconMap';
import { AlertCircle } from 'lucide-react';
import { isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface StudentActivityChartProps {
  logs: RecordedExercise[];
  students?: Student[]; 
  selectedStudent?: Student | null;
  availableExercises: ExerciseType[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal;
}

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

  const chartConfig = availableExercises.reduce((acc, ex, index) => {
    acc[ex.id] = {
      label: ex.koreanName,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
      icon: getIconByName(ex.iconName)
    };
    return acc;
  }, {} as Record<string, { label: string, color: string, icon?: React.ComponentType }>) satisfies ChartConfig;

  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  if (!relevantStudents || relevantStudents.length === 0) {
     return (
       <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">운동 요약</CardTitle>
          <CardDescription>표시할 학생 데이터가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">교사 페이지에서 학생을 추가하거나, 학생이 로그인해야 합니다.</p>
        </CardContent>
      </Card>
    );
  }
  const relevantStudentIds = relevantStudents.map(s => s.id);

  const now = new Date();
  let interval: { start: Date, end: Date };
  if (timeFrame === 'today') {
    interval = { start: new Date(now.setHours(0,0,0,0)), end: new Date(now.setHours(23,59,59,999)) };
  } else if (timeFrame === 'week') {
    interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  } else { // month
    interval = { start: startOfMonth(now), end: endOfMonth(now) };
  }

  const dataToDisplay = logs.filter(log => {
    try {
        const logDate = parseISO(log.date);
        return relevantStudentIds.includes(log.studentId) && isWithinInterval(logDate, interval);
    } catch (e) {
        console.error("Error parsing log date:", log.date, e);
        return false;
    }
  });

  const chartData = availableExercises.map(exercise => {
    const exerciseLogs = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    const currentGoal = studentGoals[exercise.id]; 

    let achievedValue = 0;
    let goalValue: number | undefined = undefined;
    let unit = '';
    let displayMetricLabel = '';

    if (exercise.category === 'count_time') {
      const totalAchievedCount = exerciseLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
      const totalAchievedTime = exerciseLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);

      if (currentGoal?.count !== undefined && exercise.countUnit) {
        achievedValue = totalAchievedCount;
        goalValue = currentGoal.count;
        unit = exercise.countUnit;
        displayMetricLabel = exercise.countUnit;
      } else if (currentGoal?.time !== undefined && exercise.timeUnit) {
        achievedValue = totalAchievedTime;
        goalValue = currentGoal.time;
        unit = exercise.timeUnit;
        displayMetricLabel = exercise.timeUnit;
      } else {
        if (totalAchievedCount > 0 && exercise.countUnit) {
            achievedValue = totalAchievedCount;
            unit = exercise.countUnit;
            displayMetricLabel = exercise.countUnit;
        } else if (totalAchievedTime > 0 && exercise.timeUnit) {
            achievedValue = totalAchievedTime;
            unit = exercise.timeUnit;
            displayMetricLabel = exercise.timeUnit;
        } else if (exercise.countUnit) {
             achievedValue = 0; unit = exercise.countUnit; displayMetricLabel = exercise.countUnit;
        } else if (exercise.timeUnit) {
             achievedValue = 0; unit = exercise.timeUnit; displayMetricLabel = exercise.timeUnit;
        }
      }
    } else if (exercise.category === 'steps_distance') {
      const totalAchievedSteps = exerciseLogs.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
      const totalAchievedDistance = exerciseLogs.reduce((sum, log) => sum + (log.distanceValue || 0), 0);

      if (currentGoal?.steps !== undefined && exercise.stepsUnit) {
        achievedValue = totalAchievedSteps;
        goalValue = currentGoal.steps;
        unit = exercise.stepsUnit;
        displayMetricLabel = exercise.stepsUnit;
      } else if (currentGoal?.distance !== undefined && exercise.distanceUnit) {
        achievedValue = totalAchievedDistance;
        goalValue = currentGoal.distance;
        unit = exercise.distanceUnit;
        displayMetricLabel = exercise.distanceUnit;
      } else {
        if (totalAchievedSteps > 0 && exercise.stepsUnit) {
            achievedValue = totalAchievedSteps;
            unit = exercise.stepsUnit;
            displayMetricLabel = exercise.stepsUnit;
        } else if (totalAchievedDistance > 0 && exercise.distanceUnit) {
            achievedValue = totalAchievedDistance;
            unit = exercise.distanceUnit;
            displayMetricLabel = exercise.distanceUnit;
        } else if (exercise.stepsUnit) {
            achievedValue = 0; unit = exercise.stepsUnit; displayMetricLabel = exercise.stepsUnit;
        } else if (exercise.distanceUnit) {
            achievedValue = 0; unit = exercise.distanceUnit; displayMetricLabel = exercise.distanceUnit;
        }
      }
    }
    
    return {
      name: exercise.koreanName,
      achieved: achievedValue,
      goal: goalValue,
      id: exercise.id,
      unit: unit,
      displayMetricLabel: displayMetricLabel || unit,
      fill: chartConfig[exercise.id]?.color || 'hsl(var(--chart-1))',
    };
  });
  
  const hasEffectiveGoals = Object.values(studentGoals).some(g => g && Object.values(g).some(val => val && val > 0));
  const noLogsForPeriod = dataToDisplay.length === 0;

  if (noLogsForPeriod && !hasEffectiveGoals) {
     return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>선택된 기간에 기록된 운동이 없고,</p>
        <p>설정된 목표도 없습니다.</p>
         <p className="text-xs mt-2">운동을 기록하거나 목표를 설정해주세요.</p>
      </div>
    );
  }

  // Show all available exercises on the X-axis. Bars will be 0 if no achievement.
  const finalChartData = chartData; 

  return (
    <Card className="shadow-md rounded-xl w-full">
      <CardHeader>
        <CardTitle className="font-headline">
          {(selectedStudent ? `${selectedStudent.name} 학생` : "전체 학급")} 활동 요약 ({timeFrame === 'today' ? '오늘' : timeFrame === 'week' ? '주간' : '월간'})
        </CardTitle>
        <CardDescription>각 운동별 달성량을 확인하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={350}> 
            <BarChart data={finalChartData} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}> 
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80} 
              />
              <YAxis
                tickFormatter={(value) => `${value}`}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                allowDecimals={true} // Allow decimals for varied units
                domain={[0, 'auto']} // Ensure Y-axis starts at 0
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as { 
                        name: string; 
                        achieved: number; 
                        goal?: number; 
                        unit: string; 
                        id: string; 
                        displayMetricLabel: string;
                    };
                    let goalText = "";
                    if (data.goal !== undefined && data.goal > 0) {
                      goalText = ` / 목표: ${data.goal}${data.unit}`;
                    } else if (data.goal === undefined && data.unit) {
                       goalText = " (설정된 목표 없음)";
                    }
                    
                    return (
                      <div className="bg-background p-3 border rounded-lg shadow-lg text-sm">
                        <p className="font-semibold text-base mb-1" style={{color: chartConfig[data.id]?.color }}>{`${label}`}</p>
                        <p>
                           {data.displayMetricLabel}: {data.achieved % 1 !== 0 ? data.achieved.toFixed(1) : data.achieved}{data.unit}{goalText}
                        </p>
                        {data.goal !== undefined && data.goal > 0 && data.achieved >= 0 && data.unit && (
                           <p className="text-xs mt-1">
                               {data.goal > 0 ? `달성률: ${Math.min(100, (data.achieved / data.goal) * 100).toFixed(0)}%` : (data.achieved > 0 ? '목표 초과 달성!' : '목표 달성 시작!')}
                           </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
              />
              <Bar dataKey="achieved" radius={[4, 4, 0, 0]} barSize={Math.min(60, 300 / (finalChartData.length || 1) )}>
                 {finalChartData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.fill} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default StudentActivityChart;
