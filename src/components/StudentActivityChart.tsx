
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
  students?: Student[]; // Make students optional for robustness
  selectedStudent?: Student | null;
  availableExercises: ExerciseType[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal;
}

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ 
  logs, 
  students = [], // Default to empty array if not provided
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

  // Determine the list of students whose data should be considered for the chart.
  // If a specific student is selected, only their data is used. Otherwise, data from all students in the 'students' prop is used.
  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  const relevantStudentIds = relevantStudents.map(s => s.id);


  const now = new Date();
  const getStartDate = (frame: 'today' | 'week' | 'month'): Date => {
    const startDate = new Date(now);
    if (frame === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (frame === 'week') {
      const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
      // Adjust to make Monday the start of the week (or Sunday depending on locale preference, here assuming Monday)
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
        return false;
    }
  });

  const aggregatedData = availableExercises.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    let primaryValue = 0;
    let primaryUnit = '';
    let valueCount = 0; 

    if (exercise.category === 'count_time') {
      const goal = studentGoals[exercise.id];
      let preferTime = false;
      if (goal) {
        if (goal.time && goal.time > 0 && exercise.timeUnit) preferTime = true;
        else if (goal.count && goal.count > 0 && exercise.countUnit) preferTime = false;
        else if (exercise.timeUnit) preferTime = true; // Default to time if unit exists
        else preferTime = false; // Default to count if time unit doesn't exist
      } else if (exercise.timeUnit) { // No goal, but time unit exists
        preferTime = true;
      }

      if (preferTime && exercise.timeUnit) {
        const totalTime = logsForExercise.reduce((sum, log) => {
          if (log.timeValue !== undefined && log.timeValue > 0) {
            valueCount++;
            return sum + log.timeValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalTime / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.timeUnit;
      } else if (exercise.countUnit) { // Handles cases where preferTime is false OR timeUnit doesn't exist but countUnit does
        const totalCount = logsForExercise.reduce((sum, log) => {
          if (log.countValue !== undefined && log.countValue > 0) {
            valueCount++;
            return sum + log.countValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalCount / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.countUnit;
      }
    } else if (exercise.category === 'steps_distance') {
      const goal = studentGoals[exercise.id];
      let preferDistance = false;
      if (goal) {
        if (goal.distance && goal.distance > 0 && exercise.distanceUnit) preferDistance = true;
        else if (goal.steps && goal.steps > 0 && exercise.stepsUnit) preferDistance = false;
        else if (exercise.distanceUnit) preferDistance = true;
        else preferDistance = false;
      } else if (exercise.distanceUnit) {
        preferDistance = true;
      }

      if (preferDistance && exercise.distanceUnit) {
        const totalDistance = logsForExercise.reduce((sum, log) => {
          if (log.distanceValue !== undefined && log.distanceValue > 0) {
            valueCount++;
            return sum + log.distanceValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalDistance / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.distanceUnit;
      } else if (exercise.stepsUnit) {
         const totalSteps = logsForExercise.reduce((sum, log) => {
          if (log.stepsValue !== undefined && log.stepsValue > 0) {
            valueCount++;
            return sum + log.stepsValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalSteps / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.stepsUnit;
      }
    }

    return {
      name: exercise.koreanName,
      value: primaryValue,
      id: exercise.id,
      unit: primaryUnit,
      fill: chartConfig[exercise.id]?.color || 'hsl(var(--chart-1))',
    };
  });

  const chartData = aggregatedData.filter(d => d.value > 0 && d.unit);

  if (students.length === 0 && !selectedStudent) { // Check if no students list and no specific selected student
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

  if (dataToDisplay.length === 0) {
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

  if (chartData.length === 0) {
     return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>관련된 운동 기록에서 유효한 평균값을 계산할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">의미있는 데이터가 포함된 운동을 기록해주세요.</p>
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
        <CardDescription>각 운동별 평균값 (주요 단위 기준)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={350}> 
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}> 
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
                    const data = payload[0].payload as { name: string; value: number; unit: string; id: string };
                    return (
                      <div className="bg-background p-3 border rounded-lg shadow-lg text-sm">
                        <p className="font-semibold text-base mb-1" style={{color: chartConfig[data.id]?.color }}>{`${label}`}</p>
                        <p>{`평균: ${data.value} ${data.unit}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={Math.min(60, 300 / (chartData.length || 1) )}>
                 {chartData.map((entry) => (
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
