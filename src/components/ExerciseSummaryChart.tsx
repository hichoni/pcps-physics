import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ExerciseSummaryChartProps {
  recordedExercises: RecordedExercise[];
  students: Student[];
  selectedStudent?: Student | null;
}

const chartConfig = EXERCISES.reduce((acc, ex, index) => {
  acc[ex.id] = { 
    label: ex.koreanName, 
    color: `hsl(var(--chart-${(index % 5) + 1}))` 
  };
  return acc;
}, {} as Record<string, { label: string, color: string }>) satisfies ChartConfig;


const ExerciseSummaryChart: React.FC<ExerciseSummaryChartProps> = ({ recordedExercises, selectedStudent }) => {
  
  const dataToDisplay = recordedExercises.filter(log => !selectedStudent || log.studentId === selectedStudent.id);

  const aggregatedData = EXERCISES.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    let primaryValue = 0;
    let primaryUnit = '';

    if (exercise.category === 'count_time') {
      const totalTime = logsForExercise.reduce((sum, log) => sum + (log.timeValue || 0), 0);
      primaryValue = logsForExercise.length > 0 ? parseFloat((totalTime / logsForExercise.length).toFixed(1)) : 0;
      primaryUnit = exercise.timeUnit || '분';
    } else if (exercise.category === 'steps_distance') {
      const totalDistance = logsForExercise.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
      primaryValue = logsForExercise.length > 0 ? parseFloat((totalDistance / logsForExercise.length).toFixed(1)) : 0;
      primaryUnit = exercise.distanceUnit || 'm';
    }
    
    return {
      name: exercise.koreanName, // For XAxis display
      average: primaryValue,     // Value for the bar
      id: exercise.id,           // For matching with chartConfig
      unit: primaryUnit,         // For tooltip or context
    };
  });

  if (recordedExercises.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">운동 요약</CardTitle>
          <CardDescription>아직 기록된 운동 데이터가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">요약을 보려면 운동을 기록하세요.</p>
        </CardContent>
      </Card>
    );
  }
  
  const chartData = aggregatedData.filter(d => d.average > 0);

  return (
    <Card className="shadow-lg rounded-xl w-full">
      <CardHeader>
        <CardTitle className="font-headline">
          {selectedStudent ? `${selectedStudent.name}의 요약` : "전체 운동 요약"}
        </CardTitle>
        <CardDescription>운동 세션당 평균값 (시간 또는 거리 기준)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `${value}`} // Display unit in tooltip now
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as { name: string; average: number; unit: string };
                    return (
                      <div className="bg-background p-2 border rounded shadow-lg">
                        <p className="font-semibold">{`${label}`}</p>
                        <p className="text-sm">{`평균: ${data.average} ${data.unit}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value, entry) => {
                  const exercise = EXERCISES.find(ex => ex.id === (entry as any).payload.id);
                  return exercise ? exercise.koreanName : value;
              }}/>
              {EXERCISES.filter(ex => aggregatedData.find(ad => ad.id === ex.id && ad.average > 0)).map((exercise) => (
                 <Bar key={exercise.id} dataKey="average" name={exercise.koreanName} fill={chartConfig[exercise.id]?.color || "hsl(var(--primary))"} radius={[4, 4, 0, 0]} barSize={40} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ExerciseSummaryChart;
