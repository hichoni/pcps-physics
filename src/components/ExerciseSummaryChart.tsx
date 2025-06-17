
import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { ChartConfig, ChartContainer } from '@/components/ui/chart'; 

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


const ExerciseSummaryChart: React.FC<ExerciseSummaryChartProps> = ({ recordedExercises, students, selectedStudent }) => {
  
  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  const relevantStudentIds = relevantStudents.map(s => s.id);

  const dataToDisplay = recordedExercises.filter(log => relevantStudentIds.includes(log.studentId));

  const aggregatedData = EXERCISES.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    let primaryValue = 0;
    let primaryUnit = '';
    let valueCount = 0; 

    if (exercise.category === 'count_time') {
      // 시간 기반 운동 (플랭크 등)의 경우 '시간'을 우선으로, 없으면 '횟수'
      if (exercise.timeUnit) {
        const totalTime = logsForExercise.reduce((sum, log) => {
          if (log.timeValue !== undefined && log.timeValue > 0) {
            valueCount++;
            return sum + log.timeValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalTime / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.timeUnit;
      } else if (exercise.countUnit) { // 시간이 주요 단위가 아닌 경우 (스쿼트, 줄넘기)
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
      // 거리 기반 운동 (걷기/달리기)의 경우 '거리'를 우선으로, 없으면 '걸음수'
       if (exercise.distanceUnit) {
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
      average: primaryValue,     
      id: exercise.id,           
      unit: primaryUnit,
      fill: chartConfig[exercise.id]?.color || 'hsl(var(--chart-1))',      
    };
  });

  const chartData = aggregatedData.filter(d => d.average > 0 && d.unit); // 유효한 데이터만 필터링

  if (dataToDisplay.length === 0) { 
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>
            {selectedStudent 
              ? "아직 기록된 운동 데이터가 없습니다."
              : (students.length === 0 ? "등록된 학생이 없습니다." : "아직 기록된 운동 데이터가 없습니다.")
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {selectedStudent
              ? "요약을 보려면 운동을 기록하세요."
              : (students.length === 0 ? "학생을 먼저 추가해주세요." : "요약을 보려면 운동을 기록하세요.")
            }
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
          {selectedStudent ? `${selectedStudent.name}의 요약` : "전체 운동 요약"}
        </CardTitle>
        <CardDescription>운동 세션당 평균값 (주요 단위 기준)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tickFormatter={(value) => `${value}`} 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as { name: string; average: number; unit: string; id: string };
                    return (
                      <div className="bg-background p-3 border rounded-lg shadow-lg text-sm">
                        <p className="font-semibold text-base mb-1" style={{color: chartConfig[data.id]?.color }}>{`${label}`}</p>
                        <p>{`평균: ${data.average} ${data.unit}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
              />
              <Bar dataKey="average" radius={[4, 4, 0, 0]} barSize={Math.min(60, 300 / chartData.length)}>
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

export default ExerciseSummaryChart;

