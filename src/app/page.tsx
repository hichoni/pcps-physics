
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ExerciseSummaryChart from '@/components/ExerciseSummaryChart';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import AddStudentDialog from '@/components/AddStudentDialog'; // 추가
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // 추가
import type { Student, ClassName, RecordedExercise, Exercise } from '@/lib/types';
import { STUDENTS_DATA, CLASSES, EXERCISES } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; // 추가
import { Users, BarChart2, Lightbulb, ListChecks, UserPlus, Trash2 } from 'lucide-react'; // UserPlus, Trash2 추가
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';


const formatExerciseValue = (exercise: Exercise, log: RecordedExercise): string => {
  let parts = [];
  if (exercise.category === 'count_time') {
    if (log.countValue !== undefined) parts.push(`${log.countValue}${exercise.countUnit}`);
    if (log.timeValue !== undefined) parts.push(`${log.timeValue}${exercise.timeUnit}`);
  } else if (exercise.category === 'steps_distance') {
    if (log.stepsValue !== undefined) parts.push(`${log.stepsValue}${exercise.stepsUnit}`);
    if (log.distanceValue !== undefined) parts.push(`${log.distanceValue}${exercise.distanceUnit}`);
  }
  return parts.join(', ');
};


export default function Home() {
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(CLASSES[0]);
  
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      const savedStudents = localStorage.getItem('physEdPalStudents');
      return savedStudents ? JSON.parse(savedStudents) : STUDENTS_DATA;
    }
    return STUDENTS_DATA;
  });

  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<Student | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('physEdPalLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<string>("students");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false); // 추가
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null); // 추가
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false); // 추가


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('physEdPalStudents', JSON.stringify(students));
    }
  }, [students]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('physEdPalLogs', JSON.stringify(recordedExercises));
    }
  }, [recordedExercises]);

  useEffect(() => {
    if (selectedClass) {
      setStudentsInClass(students.filter(student => student.class === selectedClass));
    } else {
      // 만약 특정 학급이 선택되지 않았다면 모든 학생을 보여주거나, 빈 배열로 둘 수 있습니다.
      // 여기서는 선택된 학급이 있을 때만 필터링하고, 그렇지 않으면 모든 학생을 보여주는 대신 빈 배열을 사용합니다.
      // 또는 모든 학생을 보여주려면 setStudentsInClass(students) 로 설정할 수 있습니다.
      setStudentsInClass(students.filter(student => student.class === selectedClass)); // 모든 학생 또는 선택된 학급 학생
    }
  }, [selectedClass, students]);


  const handleClassChange = (className: ClassName) => {
    setSelectedClass(className);
  };

  const handleOpenLogForm = (student: Student) => {
    setSelectedStudentForLog(student);
    setIsLogFormOpen(true);
  };

  const handleCloseLogForm = () => {
    setIsLogFormOpen(false);
    setSelectedStudentForLog(null);
  };

  const handleSaveExerciseLog = (log: Omit<RecordedExercise, 'id'>) => {
    setRecordedExercises(prev => [...prev, { ...log, id: `log-${Date.now()}-${Math.random()}` }]);
  };

  const handleAddStudent = (newStudentData: { name: string; class: ClassName }) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `s${Date.now()}${Math.random().toString(36).substring(2, 7)}`, // 더 고유한 ID 생성
      avatarSeed: newStudentData.name, 
    };
    setStudents(prevStudents => [...prevStudents, newStudent]);
  };

  const requestDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
      setRecordedExercises(prevLogs => prevLogs.filter(log => log.studentId !== studentToDelete.id));
      setStudentToDelete(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };
  
  const memoizedExerciseSummaryChart = useMemo(() => (
    <ExerciseSummaryChart recordedExercises={recordedExercises} students={students} />
  ), [recordedExercises, students]);

  const memoizedAiSuggestionBox = useMemo(() => <AiSuggestionBox recordedExercises={recordedExercises} />, [recordedExercises]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <section aria-labelledby="class-selection-heading" className="bg-card p-6 rounded-xl shadow-md">
          <h2 id="class-selection-heading" className="text-xl font-semibold mb-4 font-headline">
            학급 선택
          </h2>
          <ClassSelector selectedClass={selectedClass} onClassChange={handleClassChange} />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto rounded-lg p-1.5">
            <TabsTrigger value="students" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Users className="mr-2 h-5 w-5" /> 학생 목록
            </TabsTrigger>
            <TabsTrigger value="log" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ListChecks className="mr-2 h-5 w-5" /> 활동 기록
            </TabsTrigger>
            <TabsTrigger value="summary" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <BarChart2 className="mr-2 h-5 w-5" /> 요약
            </TabsTrigger>
            <TabsTrigger value="ai" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Lightbulb className="mr-2 h-5 w-5" /> AI 코치
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <section aria-labelledby="student-list-heading">
              <div className="flex justify-between items-center mb-4">
                <h2 id="student-list-heading" className="text-xl font-semibold font-headline">
                  {selectedClass ? `${selectedClass} 학생들` : '학생을 보려면 학급을 선택하세요'}
                </h2>
                <Button onClick={() => setIsAddStudentDialogOpen(true)} className="rounded-lg">
                  <UserPlus className="mr-2 h-5 w-5" /> 학생 추가
                </Button>
              </div>
              {selectedClass && studentsInClass.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {studentsInClass.map(student => (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      onLogExercise={handleOpenLogForm}
                      onDeleteStudent={() => requestDeleteStudent(student)} // 변경
                      recordedExercises={recordedExercises}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {selectedClass ? '이 학급에는 학생이 없습니다. 학생을 추가해주세요.' : '학급을 선택해주세요.'}
                </p>
              )}
            </section>
          </TabsContent>
          
          <TabsContent value="log" className="mt-6">
             <section aria-labelledby="activity-log-heading">
                <h2 id="activity-log-heading" className="text-xl font-semibold mb-4 font-headline">최근 활동</h2>
                {recordedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto bg-card p-4 rounded-xl shadow-md">
                    {recordedExercises
                      .filter(log => !selectedClass || log.className === selectedClass)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id) )
                      .slice(0, 20) 
                      .map(log => {
                        const student = students.find(s => s.id === log.studentId); // STUDENTS_DATA 대신 students 사용
                        const exerciseInfo = EXERCISES.find(ex => ex.id === log.exerciseId);
                        if (!exerciseInfo) return null;
                        const formattedValue = formatExerciseValue(exerciseInfo, log);
                        return (
                          <div key={log.id} className="p-3 bg-secondary/30 rounded-lg shadow-sm text-sm">
                            <p><strong>{student?.name || '알 수 없는 학생'}</strong> ({log.className})</p>
                            <p>{exerciseInfo?.koreanName || '알 수 없는 운동'}: {formattedValue}</p>
                            <p className="text-xs text-muted-foreground">
                              날짜: {format(new Date(log.date), "PPP", { locale: ko })}
                            </p>
                          </div>
                        );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">아직 기록된 활동이 없습니다.</p>
                )}
             </section>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <section aria-labelledby="visualization-heading">
              <h2 id="visualization-heading" className="sr-only">운동 시각화</h2>
              {memoizedExerciseSummaryChart}
            </section>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
             <section aria-labelledby="ai-suggestion-heading">
                <h2 id="ai-suggestion-heading" className="sr-only">AI 운동 제안</h2>
                {memoizedAiSuggestionBox}
              </section>
          </TabsContent>
        </Tabs>

        {selectedStudentForLog && (
          <ExerciseLogForm
            student={selectedStudentForLog}
            isOpen={isLogFormOpen}
            onClose={handleCloseLogForm}
            onSave={handleSaveExerciseLog}
            recordedExercises={recordedExercises}
          />
        )}

        <AddStudentDialog
          isOpen={isAddStudentDialogOpen}
          onClose={() => setIsAddStudentDialogOpen(false)}
          onSave={handleAddStudent}
          allClasses={CLASSES}
        />

        {studentToDelete && (
          <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>학생 삭제 확인</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{studentToDelete.name}</strong> 학생을 정말 삭제하시겠습니까? 이 학생의 모든 운동 기록도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>취소</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <Trash2 className="mr-2 h-4 w-4" /> 삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} PhysEd Pal. 학생들이 활동적으로 지낼 수 있도록!
      </footer>
    </div>
  );
}
