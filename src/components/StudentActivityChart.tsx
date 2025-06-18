
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { getIconByName } from '@/lib/iconMap';
import { AlertCircle } from 'lucide-react';

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
      <div className="min-h-[150px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
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
       <Card className="shadow-lg rounded-xl">
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
  const getStartDate = (frame: 'today' | 'week' | 'month'): Date => {
    const startDate = new Date(now);
    if (frame === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (frame === 'week') {
      const dayOfWeek = now.getDay(); 
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (frame === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }
    return startDate;
  };
  const startDateForFrame = getStartDate(timeFrame);

  const dataToDisplay = logs.filter(log => {
    try {
        const logDateParts = log.date.split('-');
        if (logDateParts.length !== 3) return false; 

        const logDate = new Date(parseInt(logDateParts[0]), parseInt(logDateParts[1]) - 1, parseInt(logDateParts[2]));
        if (isNaN(logDate.getTime())) return false; 

        return relevantStudentIds.includes(log.studentId) && logDate >= startDateForFrame && logDate <= now;
    } catch (e) {
        console.error("Error parsing log date:", log.date, e);
        return false;
    }
  });

  const aggregatedData = availableExercises.map(exercise => {
    const exerciseLogs = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    const currentGoal = studentGoals[exercise.id];
    let achievedValue = 0;
    let goalValue: number | undefined = undefined;
    let unit = '';

    if (exercise.category === 'count_time') {
      const totalAchievedCount = exerciseLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
      const totalAchievedTime = exerciseLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);

      if (currentGoal?.count !== undefined && exercise.countUnit) {
        achievedValue = totalAchievedCount;
        goalValue = currentGoal.count;
        unit = exercise.countUnit;
      } else if (currentGoal?.time !== undefined && exercise.timeUnit) {
        achievedValue = totalAchievedTime;
        goalValue = currentGoal.time;
        unit = exercise.timeUnit;
      } else if (totalAchievedCount > 0 && exercise.countUnit) { // No specific goal, or goal unit mismatch, fallback to logged count
        achievedValue = totalAchievedCount;
        unit = exercise.countUnit;
      } else if (totalAchievedTime > 0 && exercise.timeUnit) { // Fallback to logged time
        achievedValue = totalAchievedTime;
        unit = exercise.timeUnit;
      } else if (exercise.countUnit) { // Default to count unit if nothing logged but unit exists
         achievedValue = 0;
         unit = exercise.countUnit;
      } else if (exercise.timeUnit) { // Default to time unit
         achievedValue = 0;
         unit = exercise.timeUnit;
      }


    } else if (exercise.category === 'steps_distance') {
      const totalAchievedSteps = exerciseLogs.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
      const totalAchievedDistance = exerciseLogs.reduce((sum, log) => sum + (log.distanceValue || 0), 0);

      if (currentGoal?.steps !== undefined && exercise.stepsUnit) {
        achievedValue = totalAchievedSteps;
        goalValue = currentGoal.steps;
        unit = exercise.stepsUnit;
      } else if (currentGoal?.distance !== undefined && exercise.distanceUnit) {
        achievedValue = totalAchievedDistance;
        goalValue = currentGoal.distance;
        unit = exercise.distanceUnit;
      } else if (totalAchievedSteps > 0 && exercise.stepsUnit) {
        achievedValue = totalAchievedSteps;
        unit = exercise.stepsUnit;
      } else if (totalAchievedDistance > 0 && exercise.distanceUnit) {
        achievedValue = totalAchievedDistance;
        unit = exercise.distanceUnit;
      } else if (exercise.stepsUnit) {
        achievedValue = 0;
        unit = exercise.stepsUnit;
      } else if (exercise.distanceUnit) {
        achievedValue = 0;
        unit = exercise.distanceUnit;
      }
    }
    
    return {
      name: exercise.koreanName,
      achieved: achievedValue,
      goal: goalValue,
      id: exercise.id,
      unit: unit,
      fill: chartConfig[exercise.id]?.color || 'hsl(var(--chart-1))',
    };
  });
  
  const chartData = aggregatedData.filter(d => d.unit); // Only show exercises with a valid unit/activity

  if (dataToDisplay.length === 0 && chartData.every(d => d.achieved === 0)) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>
            선택된 기간({timeFrame === 'today' ? '오늘' : timeFrame === 'week' ? '이번 주' : '이번 달'})에 기록된 운동 데이터가 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            요약을 보려면 해당 기간의 운동을 기록하세요.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out data where achieved is 0 AND no goal is set. 
  // Still show data if achieved is 0 BUT a goal is set (to show progress towards that goal).
  const finalChartData = chartData.filter(d => d.achieved > 0 || (d.achieved === 0 && d.goal !== undefined && d.goal > 0));


  if (finalChartData.length === 0) {
     return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>의미있는 활동 기록이 없거나, 설정된 목표가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">운동을 기록하거나 목표를 설정하여 활동 내역을 확인하세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl w-full">
      <CardHeader>
        <CardTitle className="font-headline">
          {(selectedStudent ? `${selectedStudent.name} 학생` : "전체 학급")} 활동 요약 ({timeFrame === 'today' ? '오늘' : timeFrame === 'week' ? '주간' : '월간'})
        </CardTitle>
        <CardDescription>각 운동별 달성량과 목표량을 확인하세요.</CardDescription>
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
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as { name: string; achieved: number; goal?: number; unit: string; id: string };
                    let goalText = "";
                    if (data.goal !== undefined && data.goal > 0) {
                      goalText = ` / 목표: ${data.goal}${data.unit}`;
                    } else if (data.goal === undefined && data.unit) {
                       goalText = " (목표 없음)";
                    }
                    
                    return (
                      <div className="bg-background p-3 border rounded-lg shadow-lg text-sm">
                        <p className="font-semibold text-base mb-1" style={{color: chartConfig[data.id]?.color }}>{`${label}`}</p>
                        <p>{`달성: ${data.achieved}${data.unit}${goalText}`}</p>
                        {data.goal !== undefined && data.goal > 0 && data.achieved > 0 && (
                           <p className="text-xs mt-1">{`달성률: ${((data.achieved / data.goal) * 100).toFixed(0)}%`}</p>
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

