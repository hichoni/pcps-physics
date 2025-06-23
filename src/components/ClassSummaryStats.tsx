
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, ListChecks, Award, Target, AlertCircle, Activity as ActivityIcon, Settings2 } from 'lucide-react';
import type { Student, RecordedExercise, CustomExercise as CustomExerciseType, StudentGoal, ClassName } from '@/lib/types';
import { format, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getIconByName } from '@/lib/iconMap';

interface ClassSummaryStatsProps {
  selectedClass: ClassName | undefined; // Changed from CustomExerciseType to ClassName
  studentsInClass: Student[];
  recordedExercises: RecordedExercise[];
  customExercises: CustomExerciseType[];
  allStudentGoals: Record<string, StudentGoal>;
  selectedLogDate: Date;
}

const ClassSummaryStats: React.FC<ClassSummaryStatsProps> = ({
  selectedClass,
  studentsInClass,
  recordedExercises,
  customExercises,
  allStudentGoals,
  selectedLogDate,
}) => {
  if (!selectedClass) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">학급 요약</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">요약 정보를 보려면 학급을 선택해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  if (studentsInClass.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">{selectedClass} 요약</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">이 학급에는 등록된 학생이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (customExercises.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline">{selectedClass} 요약</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
          <Settings2 className="h-10 w-10 mb-2 text-primary" />
          <p className="font-semibold">이 학년에는 설정된 운동이 없습니다.</p>
          <p className="text-sm">'운동 관리' 탭에서 운동을 추가해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  const logsForDateAndClass = recordedExercises.filter(log =>
    log.className === selectedClass && isSameDay(parseISO(log.date), selectedLogDate)
  );

  const activeStudentIds = new Set(logsForDateAndClass.map(log => log.studentId));
  const activeStudentCount = activeStudentIds.size;
  const totalStudentsInClass = studentsInClass.length;
  const participationRate = totalStudentsInClass > 0 ? Math.round((activeStudentCount / totalStudentsInClass) * 100) : 0;
  const totalActivitiesCount = logsForDateAndClass.length;

  const exerciseCounts: Record<string, number> = {};
  logsForDateAndClass.forEach(log => {
    exerciseCounts[log.exerciseId] = (exerciseCounts[log.exerciseId] || 0) + 1;
  });

  let mostLoggedExerciseName = "없음";
  let maxLogs = 0;
  if (logsForDateAndClass.length > 0) { // Only determine if there are logs
    for (const exerciseId in exerciseCounts) {
      if (exerciseCounts[exerciseId] > maxLogs) {
        maxLogs = exerciseCounts[exerciseId];
        const exerciseDetails = customExercises.find(ex => ex.id === exerciseId);
        mostLoggedExerciseName = exerciseDetails?.koreanName || "알 수 없는 운동";
      }
    }
    // If all exercises have same count (e.g., 1 log each for different exercises, maxLogs could remain 1)
    // and mostLoggedExerciseName might not be set if the first check wasn't > maxLogs (initially 0)
    // Or if only one type of exercise was logged once.
    if (mostLoggedExerciseName === "없음" && Object.keys(exerciseCounts).length > 0) {
        const firstExerciseIdWithCount = Object.keys(exerciseCounts)[0];
        const exerciseDetails = customExercises.find(ex => ex.id === firstExerciseIdWithCount);
        mostLoggedExerciseName = exerciseDetails?.koreanName || "알 수 없는 운동";
        maxLogs = exerciseCounts[firstExerciseIdWithCount] || 0;
    }
  }


  const goalStats = customExercises.map(exercise => {
    let studentsWithGoal = 0;
    let studentsMetGoal = 0;

    studentsInClass.forEach(student => {
      const goalData = allStudentGoals[student.id]?.[exercise.id];
      let currentGoalValue: number | undefined;
      let achievedValue = 0;

      if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
        currentGoalValue = goalData?.count;
        achievedValue = logsForDateAndClass
          .filter(log => log.studentId === student.id && log.exerciseId === exercise.id)
          .reduce((sum, log) => sum + (log.countValue || 0), 0);
      } else if (exercise.id === 'plank') {
        currentGoalValue = goalData?.time;
        achievedValue = logsForDateAndClass
          .filter(log => log.studentId === student.id && log.exerciseId === exercise.id)
          .reduce((sum, log) => sum + (log.timeValue || 0), 0);
      } else if (exercise.id === 'walk_run') {
        currentGoalValue = goalData?.steps;
        achievedValue = logsForDateAndClass
          .filter(log => log.studentId === student.id && log.exerciseId === exercise.id)
          .reduce((sum, log) => sum + (log.stepsValue || 0), 0);
      }

      if (currentGoalValue !== undefined && currentGoalValue > 0) {
        studentsWithGoal++;
        if (achievedValue >= currentGoalValue) {
          studentsMetGoal++;
        }
      }
    });
    const Icon = getIconByName(exercise.iconName);
    return {
      id: exercise.id,
      name: exercise.koreanName,
      icon: Icon || ActivityIcon,
      studentsWithGoal,
      studentsMetGoal,
      hasAnyGoalSet: studentsWithGoal > 0,
    };
  }).filter(stat => stat.hasAnyGoalSet); 

  return (
    <div className="space-y-6">
      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            {selectedClass} ({format(selectedLogDate, "MM월 dd일", { locale: ko })}) 요약
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 참여 학생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudentCount} / {totalStudentsInClass} 명</div>
            <p className="text-xs text-muted-foreground">{participationRate}% 참여</p>
            <Progress value={participationRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 총 활동 건수</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivitiesCount} 건</div>
            <p className="text-xs text-muted-foreground">
              {activeStudentCount > 0 ? `평균 ${ (totalActivitiesCount / activeStudentCount).toFixed(1) } 건/학생` : "활동 기록 없음"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 가장 많이 한 운동</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostLoggedExerciseName}</div>
            <p className="text-xs text-muted-foreground">
                {maxLogs > 0 ? `총 ${maxLogs}회 기록됨` : (logsForDateAndClass.length > 0 && mostLoggedExerciseName !== "없음" ? `기록됨 (각 1회 또는 동률)` : "활동 기록 없음")}
            </p>
          </CardContent>
        </Card>
      </div>

      {goalStats.length > 0 && (
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              운동별 목표 달성 현황 (오늘)
            </CardTitle>
            <CardDescription>목표를 설정한 학생 기준입니다.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goalStats.map(stat => (
              <div key={stat.id} className="p-3 border rounded-md bg-secondary/30">
                <div className="flex items-center mb-1">
                   <stat.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">{stat.name}</h4>
                </div>
                {stat.studentsWithGoal > 0 ? (
                  <>
                    <p className="text-xs text-foreground">
                      {stat.studentsMetGoal} / {stat.studentsWithGoal} 명 목표 달성
                    </p>
                    <Progress value={(stat.studentsMetGoal / stat.studentsWithGoal) * 100} className="h-1.5 mt-1" />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">이 운동에 목표를 설정한 학생 없음</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {logsForDateAndClass.length > 0 && goalStats.length === 0 && (
         <Card className="shadow-sm rounded-lg">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">목표 달성 현황</CardTitle>
             <AlertCircle className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground">
               오늘 활동 기록은 있지만, 현재 학급 학생들이 이 날짜에 해당하는 운동 목표를 설정하지 않았습니다.
             </p>
           </CardContent>
         </Card>
      )}
    </div>
  );
};

export default ClassSummaryStats;
