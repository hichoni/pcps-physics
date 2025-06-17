
import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, Exercise } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { ChartConfig, ChartContainer } from '@/components/ui/chart'; // ChartTooltipContent 제거 (page.tsx 에서 직접 사용)

interface ExerciseSummaryChartProps {
  recordedExercises: RecordedExercise[];
  students: Student[]; // students prop 추가
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
  
  // selectedStudent가 있으면 해당 학생의 데이터만, 없으면 모든 학생 데이터 사용
  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  const relevantStudentIds = relevantStudents.map(s => s.id);

  const dataToDisplay = recordedExercises.filter(log => relevantStudentIds.includes(log.studentId));

  const aggregatedData = EXERCISES.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    let primaryValue = 0;
    let primaryUnit = '';
    let valueCount = 0; // 평균 계산을 위한 기록 수

    if (exercise.category === 'count_time') {
      const totalTime = logsForExercise.reduce((sum, log) => {
        if (log.timeValue !== undefined && log.timeValue > 0) {
          valueCount++;
          return sum + log.timeValue;
        }
        return sum;
      }, 0);
      primaryValue = valueCount > 0 ? parseFloat((totalTime / valueCount).toFixed(1)) : 0;
      primaryUnit = exercise.timeUnit || '분';
    } else if (exercise.category === 'steps_distance') {
      const totalDistance = logsForExercise.reduce((sum, log) => {
        if (log.distanceValue !== undefined && log.distanceValue > 0) {
          valueCount++;
          return sum + log.distanceValue;
        }
        return sum;
      }, 0);
      primaryValue = valueCount > 0 ? parseFloat((totalDistance / valueCount).toFixed(1)) : 0;
      primaryUnit = exercise.distanceUnit || 'm';
    }
    
    return {
      name: exercise.koreanName, 
      average: primaryValue,     
      id: exercise.id,           
      unit: primaryUnit,         
    };
  });

  if (dataToDisplay.length === 0) { // recordedExercises.length 대신 dataToDisplay.length 사용
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>
            {selectedStudent 
              ? (dataToDisplay.length === 0 ? "아직 기록된 운동 데이터가 없습니다." : "운동 세션당 평균값 (시간 또는 거리 기준)")
              : (students.length === 0 ? "등록된 학생이 없습니다." : (dataToDisplay.length === 0 ? "아직 기록된 운동 데이터가 없습니다." : "운동 세션당 평균값 (시간 또는 거리 기준)"))
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
  
  const chartData = aggregatedData.filter(d => d.average > 0);

  if (chartData.length === 0) {
     return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">
            {selectedStudent ? `${selectedStudent.name} 학생의 운동 요약` : "전체 운동 요약"}
          </CardTitle>
          <CardDescription>관련된 운동 기록에서 유효한 평균값을 계산할 수 없습니다 (시간 또는 거리).</CardDescription>
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
        <CardDescription>운동 세션당 평균값 (시간 또는 거리 기준)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `${value}`} 
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
              <Legend 
                wrapperStyle={{ fontSize: '12px' }} 
                formatter={(value, entry) => {
                  const payloadId = (entry as any)?.payload?.id;
                  if (payloadId && chartConfig[payloadId]) {
                    return chartConfig[payloadId].label;
                  }
                  return value;
                }}
              />
              {/* 데이터 키를 직접 참조하도록 Bar 수정 */}
              <Bar dataKey="average" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={40}>
                {/* 각 Bar에 다른 색상을 적용하려면 chartData에 색상 정보를 포함하거나,
                    EXERCISES.map을 사용하여 각 운동 유형에 맞는 Bar를 생성해야 합니다.
                    현재는 단일 Bar 컴포넌트가 모든 데이터를 렌더링하므로,
                    Legend에서 payload를 통해 각 Bar의 이름을 구분하고,
                    Tooltip에서 해당 Bar의 데이터를 표시합니다.
                    EXERCISES.filter(ex => chartData.find(ad => ad.id === ex.id)).map((exercise) => (
                        <Bar key={exercise.id} dataKey={exercise.id} name={exercise.koreanName} fill={chartConfig[exercise.id]?.color || "hsl(var(--primary))"} radius={[4, 4, 0, 0]} barSize={40} />
                    ))
                    위와 같이 하려면 data 구조가 { name: '스쿼트', ex1: 10, ex2: 5 ... } 와 같아야 합니다.
                    현재 data 구조는 { name: '스쿼트', average: 10, id: 'ex1' } 이므로 단일 Bar 컴포넌트를 사용합니다.
                */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ExerciseSummaryChart;
