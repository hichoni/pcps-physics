
import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordedExercise, Student, CustomExercise as CustomExerciseType } from '@/lib/types'; // Exercise -> CustomExerciseType
// import { EXERCISES } from '@/data/mockData'; // Replaced by customExercises prop
import { ChartConfig, ChartContainer } from '@/components/ui/chart'; 
import { getIconByName } from '@/lib/iconMap';

interface ExerciseSummaryChartProps {
  recordedExercises: RecordedExercise[];
  students: Student[]; 
  selectedStudent?: Student | null;
  customExercises: CustomExerciseType[]; // Add customExercises prop
}

const ExerciseSummaryChart: React.FC<ExerciseSummaryChartProps> = ({ recordedExercises, students, selectedStudent, customExercises }) => {
  
  const chartConfig = customExercises.reduce((acc, ex, index) => {
    acc[ex.id] = { 
      label: ex.koreanName, 
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
      icon: getIconByName(ex.iconName)
    };
    return acc;
  }, {} as Record<string, { label: string, color: string, icon?: React.ComponentType }>) satisfies ChartConfig;

  const relevantStudents = selectedStudent ? [selectedStudent] : students;
  const relevantStudentIds = relevantStudents.map(s => s.id);

  const dataToDisplay = recordedExercises.filter(log => relevantStudentIds.includes(log.studentId));

  const aggregatedData = customExercises.map(exercise => {
    const logsForExercise = dataToDisplay.filter(log => log.exerciseId === exercise.id);
    let primaryValue = 0;
    let primaryUnit = '';
    let valueCount = 0; 

    if (exercise.category === 'count_time') {
      if (exercise.timeUnit && exercise.defaultTime && exercise.defaultTime > 0) { // 시간 목표가 설정되어 있으면 시간을 우선
        const totalTime = logsForExercise.reduce((sum, log) => {
          if (log.timeValue !== undefined && log.timeValue > 0) {
            valueCount++;
            return sum + log.timeValue;
          }
          return sum;
        }, 0);
        primaryValue = valueCount > 0 ? parseFloat((totalTime / valueCount).toFixed(1)) : 0;
        primaryUnit = exercise.timeUnit;
      } else if (exercise.countUnit) { 
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
       if (exercise.distanceUnit && exercise.defaultDistance && exercise.defaultDistance > 0) { // 거리 목표가 있으면 거리 우선
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

  const chartData = aggregatedData.filter(d => d.average > 0 && d.unit); 

  if (customExercises.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">운동 요약</CardTitle>
          <CardDescription>운동 목록이 설정되지 않았습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">교사 페이지에서 운동을 추가해주세요.</p>
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
