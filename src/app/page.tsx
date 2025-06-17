
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ExerciseSummaryChart from '@/components/ExerciseSummaryChart';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import AddStudentDialog from '@/components/AddStudentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Student, ClassName, RecordedExercise, Exercise, Gender } from '@/lib/types';
import { STUDENTS_DATA, CLASSES, EXERCISES } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, BarChart2, Lightbulb, ListChecks, UserPlus, Trash2, Sparkles, MessageSquarePlus, MessageSquareX } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";


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

const DEFAULT_COMPLIMENTS = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];
const COMPLIMENTS_STORAGE_KEY = 'physEdPalCompliments_v1';

export default function Home() {
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(CLASSES[0]);
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      const savedStudents = localStorage.getItem('physEdPalStudents_v2');
      return savedStudents ? JSON.parse(savedStudents) : STUDENTS_DATA;
    }
    return STUDENTS_DATA;
  });

  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<Student | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('physEdPalLogs_v2');
      return savedLogs ? JSON.parse(savedLogs) : [];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<string>("students");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const [compliments, setCompliments] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCompliments = localStorage.getItem(COMPLIMENTS_STORAGE_KEY);
      return savedCompliments ? JSON.parse(savedCompliments) : DEFAULT_COMPLIMENTS;
    }
    return DEFAULT_COMPLIMENTS;
  });
  const [newCompliment, setNewCompliment] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('physEdPalStudents_v2', JSON.stringify(students));
    }
  }, [students]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('physEdPalLogs_v2', JSON.stringify(recordedExercises));
    }
  }, [recordedExercises]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPLIMENTS_STORAGE_KEY, JSON.stringify(compliments));
    }
  }, [compliments]);


  useEffect(() => {
    if (selectedClass) {
      setStudentsInClass(students.filter(student => student.class === selectedClass).sort((a, b) => a.studentNumber - b.studentNumber));
    } else {
      setStudentsInClass(students.sort((a,b) => {
        const classCompare = a.class.localeCompare(b.class);
        if (classCompare !== 0) return classCompare;
        return a.studentNumber - b.studentNumber;
      }));
    }
  }, [selectedClass, students]);


  const handleClassChange = (className: ClassName | 'all') => { 
    if (className === 'all') {
      setSelectedClass(undefined); 
    } else {
      setSelectedClass(className as ClassName);
    }
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

  const handleAddStudent = (newStudentData: { name: string; class: ClassName; studentNumber: number; gender: Gender }) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `s${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
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
  
  const handleAddCompliment = () => {
    if (newCompliment.trim() === '') {
      toast({ title: "오류", description: "칭찬 문구를 입력해주세요.", variant: "destructive"});
      return;
    }
    if (compliments.includes(newCompliment.trim())) {
      toast({ title: "오류", description: "이미 목록에 있는 칭찬 문구입니다.", variant: "destructive"});
      return;
    }
    setCompliments(prev => [...prev, newCompliment.trim()]);
    setNewCompliment('');
    toast({ title: "성공", description: "칭찬 문구가 추가되었습니다."});
  };

  const handleDeleteCompliment = (complimentToDelete: string) => {
    setCompliments(prev => prev.filter(c => c !== complimentToDelete));
    toast({ title: "성공", description: "칭찬 문구가 삭제되었습니다."});
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
          <ClassSelector selectedClass={selectedClass} onClassChange={handleClassChange} allClasses={CLASSES} />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto rounded-lg p-1.5">
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
            <TabsTrigger value="compliments" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Sparkles className="mr-2 h-5 w-5" /> 칭찬 문구
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <section aria-labelledby="student-list-heading">
              <div className="flex justify-between items-center mb-4">
                <h2 id="student-list-heading" className="text-xl font-semibold font-headline">
                  {selectedClass ? `${selectedClass} 학생들` : '전체 학생 목록'}
                </h2>
                <Button onClick={() => setIsAddStudentDialogOpen(true)} className="rounded-lg">
                  <UserPlus className="mr-2 h-5 w-5" /> 학생 추가
                </Button>
              </div>
              {studentsInClass.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {studentsInClass.map(student => (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      onLogExercise={handleOpenLogForm}
                      onDeleteStudent={() => requestDeleteStudent(student)}
                      recordedExercises={recordedExercises}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {selectedClass ? '이 학급에는 학생이 없습니다. 학생을 추가해주세요.' : '등록된 학생이 없습니다. 학생을 추가해주세요.'}
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
                        const student = students.find(s => s.id === log.studentId);
                        const exerciseInfo = EXERCISES.find(ex => ex.id === log.exerciseId);
                        if (!exerciseInfo) return null;
                        const formattedValue = formatExerciseValue(exerciseInfo, log);
                        return (
                          <div key={log.id} className="p-3 bg-secondary/30 rounded-lg shadow-sm text-sm">
                            <p><strong>{student?.name || '알 수 없는 학생'}</strong> ({log.className} {student?.studentNumber}번)</p>
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

          <TabsContent value="compliments" className="mt-6">
            <section aria-labelledby="compliments-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <h2 id="compliments-management-heading" className="text-xl font-semibold mb-6 font-headline flex items-center">
                <Sparkles className="mr-2 h-6 w-6 text-primary" />
                칭찬 문구 관리
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    type="text"
                    value={newCompliment}
                    onChange={(e) => setNewCompliment(e.target.value)}
                    placeholder="예: 오늘도 최고야!"
                    className="flex-grow rounded-lg text-base py-3"
                  />
                  <Button onClick={handleAddCompliment} className="rounded-lg py-3">
                    <MessageSquarePlus className="mr-2 h-5 w-5" /> 추가
                  </Button>
                </div>
                {compliments.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border p-3 rounded-lg bg-secondary/20">
                    {compliments.map((phrase, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-background rounded-md shadow-sm">
                        <span className="text-sm">{phrase}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCompliment(phrase)}
                          className="text-destructive hover:text-destructive/80"
                          aria-label={`${phrase} 삭제`}
                        >
                          <MessageSquareX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    아직 추가된 칭찬 문구가 없습니다. 위에서 추가해보세요!
                  </p>
                )}
                 <p className="text-xs text-muted-foreground">
                  학생용 앱 헤더에 표시되는 칭찬 문구 목록입니다. 매일 날짜에 따라 다른 문구가 학생들에게 표시됩니다.
                </p>
              </div>
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
                  <strong>{studentToDelete.name}</strong> ({studentToDelete.class} {studentToDelete.studentNumber}번) 학생을 정말 삭제하시겠습니까? 이 학생의 모든 운동 기록도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
        &copy; {new Date().getFullYear()} 풍풍이의 운동기록장. 학생들이 활동적으로 지낼 수 있도록!
      </footer>
    </div>
  );
}
    