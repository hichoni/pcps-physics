
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Target, History, PlusCircle, LogOut, UserCheck } from 'lucide-react';
import Image from 'next/image';
import type { Student, ClassName, Exercise, StudentGoal, ExerciseGoal } from '@/lib/types';
import { STUDENTS_DATA, CLASSES, EXERCISES } from '@/data/mockData';
import SetStudentGoalsDialog from '@/components/SetStudentGoalsDialog'; // 새로 추가될 컴포넌트
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_STUDENT_KEY = 'studentApp_currentStudent';
const LOCAL_STORAGE_GOALS_KEY_PREFIX = 'studentApp_goals_';

export default function StudentPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassName[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<ClassName | ''>('');
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [studentGoals, setStudentGoals] = useState<StudentGoal>({});

  const { toast } = useToast();

  useEffect(() => {
    // 데이터 로딩 시뮬레이션 또는 실제 데이터 페칭
    setAllStudents(STUDENTS_DATA);
    setAvailableClasses(CLASSES);
    
    const storedStudent = localStorage.getItem(LOCAL_STORAGE_STUDENT_KEY);
    if (storedStudent) {
      try {
        const student: Student = JSON.parse(storedStudent);
        setCurrentStudent(student);
        loadStudentGoals(student.id);
      } catch (e) {
        console.error("Failed to parse stored student:", e);
        localStorage.removeItem(LOCAL_STORAGE_STUDENT_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem(LOCAL_STORAGE_STUDENT_KEY, JSON.stringify(currentStudent));
      loadStudentGoals(currentStudent.id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_STUDENT_KEY);
      setStudentGoals({}); // 로그아웃 시 목표 초기화
    }
  }, [currentStudent]);

  useEffect(() => {
    if (selectedClass) {
      setStudentsInClass(allStudents.filter(student => student.class === selectedClass).sort((a,b) => a.studentNumber - b.studentNumber));
      setSelectedStudentId(''); // 학급 변경 시 학생 선택 초기화
    } else {
      setStudentsInClass([]);
    }
  }, [selectedClass, allStudents]);

  const loadStudentGoals = (studentId: string) => {
    const storedGoals = localStorage.getItem(`${LOCAL_STORAGE_GOALS_KEY_PREFIX}${studentId}`);
    if (storedGoals) {
      try {
        setStudentGoals(JSON.parse(storedGoals));
      } catch (e) {
        console.error("Failed to parse stored goals:", e);
        setStudentGoals({});
      }
    } else {
      setStudentGoals({});
    }
  };

  const handleSaveGoals = (newGoals: StudentGoal) => {
    if (currentStudent) {
      setStudentGoals(newGoals);
      localStorage.setItem(`${LOCAL_STORAGE_GOALS_KEY_PREFIX}${currentStudent.id}`, JSON.stringify(newGoals));
      toast({ title: "성공", description: "운동 목표가 저장되었습니다." });
      setIsGoalsDialogOpen(false);
    }
  };

  const handleLogin = () => {
    if (selectedStudentId) {
      const student = allStudents.find(s => s.id === selectedStudentId);
      if (student) {
        setCurrentStudent(student);
      }
    }
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setSelectedClass('');
    setSelectedStudentId('');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  }

  if (!currentStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md shadow-xl rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold font-headline text-primary">학생 선택</CardTitle>
            <CardDescription>운동 기록을 시작하려면 학급과 이름을 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">학급 선택</label>
              <Select value={selectedClass} onValueChange={(value) => setSelectedClass(value as ClassName)}>
                <SelectTrigger id="class-select" className="w-full text-base py-3 rounded-lg">
                  <SelectValue placeholder="학급을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map(cls => (
                    <SelectItem key={cls} value={cls} className="text-base py-2">{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="student-select" className="block text-sm font-medium text-gray-700">학생 선택</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClass || studentsInClass.length === 0}>
                <SelectTrigger id="student-select" className="w-full text-base py-3 rounded-lg">
                  <SelectValue placeholder={selectedClass ? (studentsInClass.length === 0 ? "이 학급에 학생 없음" : "학생을 선택하세요") : "학급을 먼저 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {studentsInClass.map(student => (
                    <SelectItem key={student.id} value={student.id} className="text-base py-2">
                      {student.studentNumber}번 {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLogin} disabled={!selectedStudentId} className="w-full py-3 text-lg rounded-lg">
              <UserCheck className="mr-2 h-5 w-5" />
              운동 시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // currentStudent가 있는 경우 (로그인 된 상태)
  return (
    <div className="flex flex-col min-h-screen">
      <StudentHeader studentName={`${currentStudent.name} (${currentStudent.class} ${currentStudent.studentNumber}번)`} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <section className="text-center bg-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold font-headline text-primary mb-3">
            {currentStudent.name}님, 안녕하세요!
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button size="lg" className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0">
              <PlusCircle className="mr-2 h-6 w-6" />
              새로운 운동 기록하기
            </Button>
            <Button variant="outline" size="lg" onClick={handleLogout} className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0">
              <LogOut className="mr-2 h-6 w-6" />
              다른 학생으로 로그인
            </Button>
          </div>
        </section>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Target className="mr-3 h-7 w-7 text-accent" />
                나의 운동 목표
              </CardTitle>
              <CardDescription>목표를 설정하고 달성해봐요!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg p-2">
                {Object.keys(studentGoals).length > 0 ? (
                  <ul className="text-sm list-disc list-inside pl-2 text-left w-full overflow-y-auto max-h-full">
                    {EXERCISES.filter(ex => studentGoals[ex.id]).map(exercise => {
                      const goal = studentGoals[exercise.id];
                      let goalText = `${exercise.koreanName}: `;
                      if (exercise.category === 'count_time') {
                        if (goal?.count) goalText += `${goal.count}${exercise.countUnit || ''}`;
                        if (goal?.count && goal?.time) goalText += ', ';
                        if (goal?.time) goalText += `${goal.time}${exercise.timeUnit || ''}`;
                      } else if (exercise.category === 'steps_distance') {
                        if (goal?.steps) goalText += `${goal.steps}${exercise.stepsUnit || ''}`;
                        if (goal?.steps && goal?.distance) goalText += ', ';
                        if (goal?.distance) goalText += `${goal.distance}${exercise.distanceUnit || ''}`;
                      }
                      return <li key={exercise.id} className="truncate">{goalText || "목표 미설정"}</li>;
                    })}
                  </ul>
                ) : (
                  <Image src="https://placehold.co/300x200.png" alt="나의 목표 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="goal achievement" />
                )}
              </div>
              <Button variant="outline" className="w-full rounded-lg" onClick={() => setIsGoalsDialogOpen(true)}>목표 설정/확인</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Dumbbell className="mr-3 h-7 w-7 text-primary" />
                추천 운동
              </CardTitle>
              <CardDescription>오늘의 추천 운동을 확인해보세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg">
                <Image src="https://placehold.co/300x200.png" alt="추천 운동 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="exercise stretching" />
              </div>
              <Button variant="outline" className="w-full rounded-lg">추천 운동 보기</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <History className="mr-3 h-7 w-7 text-destructive" />
                나의 활동 내역
              </CardTitle>
              <CardDescription>최근 운동 기록을 살펴봐요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg">
                 <Image src="https://placehold.co/300x200.png" alt="활동 내역 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="activity log" />
              </div>
              <Button variant="outline" className="w-full rounded-lg">활동 내역 보기</Button>
            </CardContent>
          </Card>
        </div>
        
        <SetStudentGoalsDialog
          isOpen={isGoalsDialogOpen}
          onClose={() => setIsGoalsDialogOpen(false)}
          onSave={handleSaveGoals}
          exercises={EXERCISES}
          currentStudent={currentStudent}
          initialGoals={studentGoals}
        />

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} {currentStudent.name}의 운동기록장. 매일매일 건강하게!
      </footer>
    </div>
  );
}

