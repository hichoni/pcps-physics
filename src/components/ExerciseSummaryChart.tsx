import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ExerciseSummaryChartProps {
  recordedExercises: RecordedExercise[];
  students: Student[]; // To potentially show individual student data later
  selectedStudent?: Student | null; // For filtering by student
}

const chartConfig = {
  value: {
    label: "Value",
  },
  ...EXERCISES.reduce((acc, ex) => {
    acc[ex.id] = { label: ex.name, color: `hsl(var(--chart-${(EXERCISES.indexOf(ex) % 5) + 1}))` };
    return acc;
  }, {} as Record<string, { label: string, color: string }>)
} satisfies ChartConfig;


const ExerciseSummaryChart: React.FC<ExerciseSummaryChartProps> = ({ recordedExercises, selectedStudent }) => {
  
  const dataToDisplay = recordedExercises.filter(log => !selectedStudent || log.studentId === selectedStudent.id);

  const aggregatedData = EXERCISES.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    const totalValue = logsForExercise.reduce((sum, log) => sum + log.value, 0);
    const averageValue = logsForExercise.length > 0 ? parseFloat((totalValue / logsForExercise.length).toFixed(1)) : 0;
    
    return {
      name: exercise.name,
      total: totalValue,
      average: averageValue,
      id: exercise.id, // For key and potentially for chartConfig matching
      unit: exercise.unit,
    };
  });

  if (recordedExercises.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">Exercise Summary</CardTitle>
          <CardDescription>No exercise data recorded yet.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Log some exercises to see the summary.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out exercises with no data to make chart cleaner
  const chartData = aggregatedData.filter(d => d.total > 0);

  return (
    <Card className="shadow-lg rounded-xl w-full">
      <CardHeader>
        <CardTitle className="font-headline">
          {selectedStudent ? `${selectedStudent.name}'s Summary` : "Overall Exercise Summary"}
        </CardTitle>
        <CardDescription>Average values per exercise session.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}/>
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="average" name="Average Value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ExerciseSummaryChart;
