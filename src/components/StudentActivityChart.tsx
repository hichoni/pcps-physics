
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import type { RecordedExercise } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  isToday, 
  parseISO 
} from 'date-fns';

interface StudentActivityChartProps {
  logs: RecordedExercise[];
  timeFrame: 'today' | 'week' | 'month';
}

const chartConfig = EXERCISES.reduce((acc, ex, index) => {
  acc[ex.id] = { 
    label: ex.koreanName, 
    color: `hsl(var(--chart-${(index % 5) + 1}))` 
  };
  return acc;
}, {} as Record<string, { label: string, color: string }>) satisfies ChartConfig;

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({ logs, timeFrame }) => {
  const today = new Date();

  const filteredLogs = logs.filter(log => {
    const logDate = parseISO(log.date);
    if (timeFrame === 'today') {
      return isToday(logDate);
    }
    if (timeFrame === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start
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

  const aggregatedData = EXERCISES.map(exercise => {
    const logsForExercise = filteredLogs.filter(log => log.exerciseId === exercise.id);
    let totalValue = 0;
    let unit = '';

    switch (exercise.id) {
      case 'ex1': // 스쿼트
        totalValue = logsForExercise.reduce((sum, log) => sum + (log.countValue || 0), 0);
        unit = exercise.countUnit || '회';
        break;
      case 'ex2': // 플랭크
        totalValue = logsForExercise.reduce((sum, log) => sum + (log.timeValue || 0), 0);
        unit = exercise.timeUnit || '초';
        break;
      case 'ex3': // 걷기/달리기
        totalValue = logsForExercise.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
        unit = exercise.distanceUnit || 'm';
        break;
      case 'ex4': // 줄넘기
        totalValue = logsForExercise.reduce((sum, log) => sum + (log.countValue || 0), 0);
        unit = exercise.countUnit || '회';
        break;
      default:
        totalValue = 0;
        unit = '';
    }
    
    return {
      exerciseId: exercise.id,
      name: exercise.koreanName, 
      value: totalValue,
      unit: unit,
      fill: chartConfig[exercise.id]?.color || 'hsl(var(--chart-1))', // 각 바에 색상 적용
    };
  }).filter(item => item.value > 0); // 값이 있는 항목만 차트에 표시

  if (filteredLogs.length === 0 || aggregatedData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-lg p-4">
        이 기간 동안 기록된 운동 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={aggregatedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} 
            interval={0} // 모든 X축 레이블 표시
            angle={-30} // 레이블 약간 기울이기 (겹침 방지)
            textAnchor="end" // 기울어진 텍스트 정렬
            height={50} // X축 높이 확보
          />
          <YAxis 
            tickFormatter={(value) => `${value}`} 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as { name: string; value: number; unit: string; exerciseId: string };
                return (
                  <div className="bg-background p-3 border rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-base mb-1" style={{ color: chartConfig[data.exerciseId]?.color }}>{`${label}`}</p>
                    <p>{`기록: ${data.value} ${data.unit}`}</p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={Math.min(60, 300 / aggregatedData.length)} >
            {aggregatedData.map((entry) => (
              <Cell key={`cell-${entry.exerciseId}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default StudentActivityChart;
