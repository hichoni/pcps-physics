
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import ExerciseSummaryChart from '@/components/ExerciseSummaryChart';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import AddStudentDialog from '@/components/AddStudentDialog';
import ManageStudentPinDialog from '@/components/ManageStudentPinDialog'; // 추가
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Student, ClassName, RecordedExercise, Exercise, Gender, TeacherExerciseRecommendation } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, BarChart2, Lightbulb, ListChecks, UserPlus, Trash2, Sparkles, MessageSquarePlus, MessageSquareX, Loader2, Wand2, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, addDoc, deleteDoc, doc, writeBatch, query, where, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

const formatExerciseValue = (exercise: Exercise, log: RecordedExercise): string => {
  let parts = [];
  if (exercise.category === 'count_time') {
    if (log.countValue !== undefined && exercise.countUnit) parts.push(`${log.countValue}${exercise.countUnit}`);
    if (log.timeValue !== undefined && exercise.timeUnit) parts.push(`${log.timeValue}${exercise.timeUnit}`);
  } else if (exercise.category === 'steps_distance') {
    if (log.stepsValue !== undefined && exercise.stepsUnit) parts.push(`${log.stepsValue}${exercise.stepsUnit}`);
    if (log.distanceValue !== undefined && exercise.distanceUnit) parts.push(`${log.distanceValue}${exercise.distanceUnit}`);
  }
  return parts.join(', ');
};

const DEFAULT_COMPLIMENTS = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];

const COMPLIMENTS_DOC_PATH = "appConfig/complimentsDoc";
const RECOMMENDATIONS_DOC_PATH = "appConfig/exerciseRecommendationsDoc";


export default function Home() {
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(undefined);
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [dynamicClasses, setDynamicClasses] = useState<ClassName[]>([]);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>([]);
  const [compliments, setCompliments] = useState<string[]>(DEFAULT_COMPLIMENTS);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<TeacherExerciseRecommendation[]>([]);

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingCompliments, setIsLoadingCompliments] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<string>("students");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  
  const [newCompliment, setNewCompliment] = useState<string>('');
  const [newRecommendationTitle, setNewRecommendationTitle] = useState<string>('');
  const [newRecommendationDetail, setNewRecommendationDetail] = useState<string>('');

  const [isManagePinDialogOpen, setIsManagePinDialogOpen] = useState(false);
  const [studentForPinManage, setStudentForPinManage] = useState<Student | null>(null);


  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsList);

      const classNames = Array.from(new Set(studentsList.map(s => s.class))).sort();
      setDynamicClasses(classNames);
    } catch (error) {
      console.error("Error fetching students: ", error);
      toast({ title: "오류", description: "학생 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
    } finally {
      setIsLoadingStudents(false);
    }
  }, [toast]);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const logsCollection = collection(db, "exerciseLogs");
      const logsSnapshot = await getDocs(logsCollection);
      const logsList = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordedExercise));
      setRecordedExercises(logsList);
    } catch (error) {
      console.error("Error fetching logs: ", error);
      toast({ title: "오류", description: "운동 기록을 불러오는 데 실패했습니다.", variant: "destructive"});
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  const fetchCompliments = useCallback(async () => {
    setIsLoadingCompliments(true);
    try {
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const complimentsDocSnap = await getDoc(complimentsDocRef);
      if (complimentsDocSnap.exists() && complimentsDocSnap.data().list) {
        setCompliments(complimentsDocSnap.data().list);
      } else {
        setCompliments(DEFAULT_COMPLIMENTS);
        if (!complimentsDocSnap.exists()) {
            await setDoc(complimentsDocRef, { list: DEFAULT_COMPLIMENTS });
        }
      }
    } catch (error) {
      console.error("Error fetching compliments: ", error);
      toast({ title: "오류", description: "칭찬 문구를 불러오는 데 실패했습니다.", variant: "destructive"});
      setCompliments(DEFAULT_COMPLIMENTS);
    } finally {
      setIsLoadingCompliments(false);
    }
  }, [toast]);

  const fetchExerciseRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      const recommendationsDocSnap = await getDoc(recommendationsDocRef);
      if (recommendationsDocSnap.exists() && recommendationsDocSnap.data().list) {
        setExerciseRecommendations(recommendationsDocSnap.data().list);
      } else {
        setExerciseRecommendations([]); 
        if (!recommendationsDocSnap.exists()) {
             await setDoc(recommendationsDocRef, { list: [] });
        }
      }
    } catch (error) {
      console.error("Error fetching exercise recommendations: ", error);
      toast({ title: "오류", description: "추천 운동/팁 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
      setExerciseRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchStudents();
    fetchLogs();
    fetchCompliments();
    fetchExerciseRecommendations();
  }, [fetchStudents, fetchLogs, fetchCompliments, fetchExerciseRecommendations]);

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

  const handleAddStudent = async (newStudentData: { name: string; class: string; studentNumber: number; gender: Gender; pin: string }) => {
    // pin은 AddStudentDialog에서 "0000"으로 고정되어 전달됨
    try {
      const studentWithAvatarAndPin = {
        ...newStudentData, // pin: "0000"이 이미 포함됨
        class: newStudentData.class.trim(),
        avatarSeed: newStudentData.name, 
      };
      const docRef = await addDoc(collection(db, "students"), studentWithAvatarAndPin);
      const newStudent = { ...studentWithAvatarAndPin, id: docRef.id };
      setStudents(prevStudents => [...prevStudents, newStudent]);

      if (!dynamicClasses.includes(newStudent.class)) {
        setDynamicClasses(prevClasses => [...prevClasses, newStudent.class].sort());
      }
      toast({ title: "성공", description: "학생이 추가되었습니다." });
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({ title: "오류", description: "학생 추가에 실패했습니다.", variant: "destructive"});
    }
  };

  const requestDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (studentToDelete) {
      try {
        const batch = writeBatch(db);
        
        const studentDocRef = doc(db, "students", studentToDelete.id);
        batch.delete(studentDocRef);

        const logsQuery = query(collection(db, "exerciseLogs"), where("studentId", "==", studentToDelete.id));
        const logsSnapshot = await getDocs(logsQuery);
        logsSnapshot.forEach(logDoc => {
          batch.delete(doc(db, "exerciseLogs", logDoc.id));
        });
        
        const goalsDocRef = doc(db, "studentGoals", studentToDelete.id);
        batch.delete(goalsDocRef);

        await batch.commit();

        setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
        setRecordedExercises(prevLogs => prevLogs.filter(log => log.studentId !== studentToDelete.id));
        
        const remainingStudents = students.filter(s => s.id !== studentToDelete.id);
        const updatedClassNames = Array.from(new Set(remainingStudents.map(s => s.class))).sort();
        setDynamicClasses(updatedClassNames);

        toast({ title: "성공", description: `${studentToDelete.name} 학생 정보가 삭제되었습니다.` });
        setStudentToDelete(null);
      } catch (error) {
        console.error("Error deleting student: ", error);
        toast({ title: "오류", description: "학생 정보 삭제에 실패했습니다.", variant: "destructive"});
      }
    }
    setIsConfirmDeleteDialogOpen(false);
  };
  
  const handleAddCompliment = async () => {
    if (newCompliment.trim() === '') {
      toast({ title: "오류", description: "칭찬 문구를 입력해주세요.", variant: "destructive"});
      return;
    }
    if (compliments.includes(newCompliment.trim())) {
      toast({ title: "오류", description: "이미 목록에 있는 칭찬 문구입니다.", variant: "destructive"});
      return;
    }
    try {
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      await updateDoc(complimentsDocRef, {
        list: arrayUnion(newCompliment.trim())
      });
      setCompliments(prev => [...prev, newCompliment.trim()]);
      setNewCompliment('');
      toast({ title: "성공", description: "칭찬 문구가 추가되었습니다."});
    } catch (error) {
      console.error("Error adding compliment: ", error);
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const currentDoc = await getDoc(complimentsDocRef);
      if (!currentDoc.exists()) {
         await setDoc(complimentsDocRef, { list: [newCompliment.trim(), ...DEFAULT_COMPLIMENTS.filter(c => c !== newCompliment.trim())] });
         setCompliments([newCompliment.trim(), ...DEFAULT_COMPLIMENTS.filter(c => c !== newCompliment.trim())]);
         setNewCompliment('');
         toast({ title: "성공", description: "칭찬 문구가 추가되었습니다 (새 목록 생성)."});
      } else {
        toast({ title: "오류", description: "칭찬 문구 추가에 실패했습니다.", variant: "destructive"});
      }
    }
  };

  const handleDeleteCompliment = async (complimentToDelete: string) => {
    try {
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      await updateDoc(complimentsDocRef, {
        list: arrayRemove(complimentToDelete)
      });
      setCompliments(prev => prev.filter(c => c !== complimentToDelete));
      toast({ title: "성공", description: "칭찬 문구가 삭제되었습니다."});
    } catch (error) {
      console.error("Error deleting compliment: ", error);
      toast({ title: "오류", description: "칭찬 문구 삭제에 실패했습니다.", variant: "destructive"});
    }
  };

  const handleAddExerciseRecommendation = async () => {
    const title = newRecommendationTitle.trim();
    const detail = newRecommendationDetail.trim();
    if (title === '' || detail === '') {
      toast({ title: "오류", description: "추천 운동/팁의 제목과 내용을 모두 입력해주세요.", variant: "destructive"});
      return;
    }
    if (exerciseRecommendations.some(rec => rec.recommendationTitle === title)) {
      toast({ title: "오류", description: "이미 목록에 있는 추천 제목입니다.", variant: "destructive"});
      return;
    }
    const newRecommendation: TeacherExerciseRecommendation = { recommendationTitle: title, recommendationDetail: detail };
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      await updateDoc(recommendationsDocRef, {
        list: arrayUnion(newRecommendation)
      });
      setExerciseRecommendations(prev => [...prev, newRecommendation]);
      setNewRecommendationTitle('');
      setNewRecommendationDetail('');
      toast({ title: "성공", description: "추천 운동/팁이 추가되었습니다."});
    } catch (error) {
        console.error("Error adding exercise recommendation: ", error);
        const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
        const currentDoc = await getDoc(recommendationsDocRef);
        if (!currentDoc.exists()) {
            await setDoc(recommendationsDocRef, { list: [newRecommendation] });
            setExerciseRecommendations([newRecommendation]);
            setNewRecommendationTitle('');
            setNewRecommendationDetail('');
            toast({ title: "성공", description: "추천 운동/팁이 추가되었습니다 (새 목록 생성)."});
        } else {
            toast({ title: "오류", description: "추천 운동/팁 추가에 실패했습니다.", variant: "destructive"});
        }
    }
  };

  const handleDeleteExerciseRecommendation = async (recommendationToDelete: TeacherExerciseRecommendation) => {
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      await updateDoc(recommendationsDocRef, {
        list: arrayRemove(recommendationToDelete)
      });
      setExerciseRecommendations(prev => prev.filter(rec => rec.recommendationTitle !== recommendationToDelete.recommendationTitle || rec.recommendationDetail !== recommendationToDelete.recommendationDetail));
      toast({ title: "성공", description: "추천 운동/팁이 삭제되었습니다."});
    } catch (error) {
      console.error("Error deleting exercise recommendation: ", error);
      toast({ title: "오류", description: "추천 운동/팁 삭제에 실패했습니다.", variant: "destructive"});
    }
  };

  const handleOpenManagePinDialog = (student: Student) => {
    setStudentForPinManage(student);
    setIsManagePinDialogOpen(true);
  };

  const handleSaveManagedPin = async (newPin: string) => {
    if (studentForPinManage) {
      try {
        const studentDocRef = doc(db, "students", studentForPinManage.id);
        await updateDoc(studentDocRef, { pin: newPin });
        setStudents(prevStudents => 
          prevStudents.map(s => s.id === studentForPinManage.id ? { ...s, pin: newPin } : s)
        );
        toast({ title: "성공", description: `${studentForPinManage.name} 학생의 PIN이 변경되었습니다.` });
        setIsManagePinDialogOpen(false);
        setStudentForPinManage(null);
      } catch (error) {
        console.error("Error updating student PIN:", error);
        toast({ title: "오류", description: "학생 PIN 변경에 실패했습니다.", variant: "destructive" });
      }
    }
  };

  const memoizedExerciseSummaryChart = useMemo(() => (
    <ExerciseSummaryChart recordedExercises={recordedExercises} students={students} />
  ), [recordedExercises, students]);

  const memoizedAiSuggestionBox = useMemo(() => <AiSuggestionBox recordedExercises={recordedExercises} />, [recordedExercises]);

  const isLoading = isLoadingStudents || isLoadingLogs || isLoadingCompliments || isLoadingRecommendations;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-4 text-xl">데이터를 불러오는 중입니다...</span>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          &copy; {new Date().getFullYear()} 풍풍이의 운동기록장.
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <section aria-labelledby="class-selection-heading" className="bg-card p-6 rounded-xl shadow-md">
          <h2 id="class-selection-heading" className="text-xl font-semibold mb-4 font-headline">
            학급 선택
          </h2>
          <ClassSelector selectedClass={selectedClass} onClassChange={handleClassChange} allClasses={dynamicClasses} />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto rounded-lg p-1.5">
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
            <TabsTrigger value="recommendations" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Wand2 className="mr-2 h-5 w-5" /> 추천 관리
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
              {students.length === 0 && (
                <div className="text-center py-10 bg-card p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold mb-2">풍풍이 운동기록장에 오신 것을 환영합니다!</h3>
                  <p className="text-muted-foreground mb-4">아직 등록된 학생이 없습니다. 첫 학생을 추가하여 시작해보세요.</p>
                  <Button onClick={() => setIsAddStudentDialogOpen(true)} className="rounded-lg">
                    <UserPlus className="mr-2 h-5 w-5" /> 첫 학생 추가하기
                  </Button>
                </div>
              )}
              { students.length > 0 && studentsInClass.length === 0 && selectedClass && (
                 <p className="text-muted-foreground">
                  {selectedClass ? '이 학급에는 학생이 없습니다. 학생을 추가해주세요.' : '선택된 학급에 학생이 없습니다. 다른 학급을 선택하거나 이 학급에 학생을 추가해주세요.'}
                 </p>
              )}
              {studentsInClass.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {studentsInClass.map(student => (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      onDeleteStudent={() => requestDeleteStudent(student)}
                      onManagePin={() => handleOpenManagePinDialog(student)} // 추가
                      recordedExercises={recordedExercises}
                    />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
          
          <TabsContent value="log" className="mt-6">
             <section aria-labelledby="activity-log-heading">
                <h2 id="activity-log-heading" className="text-xl font-semibold mb-4 font-headline">최근 활동 (최대 20개)</h2>
                {recordedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto bg-card p-4 rounded-xl shadow-md">
                    {recordedExercises
                      .filter(log => !selectedClass || log.className === selectedClass)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0) )
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
                {isLoadingCompliments && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isLoadingCompliments && compliments.length > 0 ? (
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
                 !isLoadingCompliments && <p className="text-sm text-muted-foreground text-center py-4">
                    아직 추가된 칭찬 문구가 없습니다. 위에서 추가해보세요!
                  </p>
                )}
                 <p className="text-xs text-muted-foreground">
                  학생용 앱 헤더에 표시되는 칭찬 문구 목록입니다. 매일 날짜에 따라 다른 문구가 학생들에게 표시됩니다.
                </p>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <section aria-labelledby="recommendations-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <h2 id="recommendations-management-heading" className="text-xl font-semibold mb-6 font-headline flex items-center">
                <Wand2 className="mr-2 h-6 w-6 text-primary" />
                추천 운동/팁 관리
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recommendationTitleInput" className="text-base">제목</Label>
                  <Input 
                    id="recommendationTitleInput"
                    type="text"
                    value={newRecommendationTitle}
                    onChange={(e) => setNewRecommendationTitle(e.target.value)}
                    placeholder="예: 신나는 제자리 뛰기"
                    className="rounded-lg text-base py-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendationDetailInput" className="text-base">내용</Label>
                  <Textarea
                    id="recommendationDetailInput"
                    value={newRecommendationDetail}
                    onChange={(e) => setNewRecommendationDetail(e.target.value)}
                    placeholder="예: 무릎을 살짝 구부렸다가 힘껏 점프! 착지는 사뿐히."
                    className="rounded-lg text-base py-3 min-h-[80px]"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddExerciseRecommendation} className="rounded-lg py-3 w-full sm:w-auto">
                  <MessageSquarePlus className="mr-2 h-5 w-5" /> 추천 추가
                </Button>
                
                {isLoadingRecommendations && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isLoadingRecommendations && exerciseRecommendations.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto border p-3 rounded-lg bg-secondary/20">
                    {exerciseRecommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-background rounded-md shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-primary">{rec.recommendationTitle}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.recommendationDetail}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteExerciseRecommendation(rec)}
                            className="text-destructive hover:text-destructive/80 ml-2 shrink-0"
                            aria-label={`${rec.recommendationTitle} 삭제`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                 !isLoadingRecommendations && <p className="text-sm text-muted-foreground text-center py-4">
                    아직 추가된 추천 운동/팁이 없습니다. 위에서 추가해보세요!
                  </p>
                )}
                 <p className="text-xs text-muted-foreground">
                  학생용 앱 '오늘의 추천 운동/팁'에 표시될 목록입니다. 목록에 내용이 있으면 여기서 임의로 선택되어 학생에게 보여집니다. 비어있으면 AI가 생성합니다.
                </p>
              </div>
            </section>
          </TabsContent>

        </Tabs>

        <AddStudentDialog
          isOpen={isAddStudentDialogOpen}
          onClose={() => setIsAddStudentDialogOpen(false)}
          onSave={handleAddStudent}
        />

        {studentForPinManage && (
          <ManageStudentPinDialog
            isOpen={isManagePinDialogOpen}
            onClose={() => {
              setIsManagePinDialogOpen(false);
              setStudentForPinManage(null);
            }}
            onSave={handleSaveManagedPin}
            studentName={studentForPinManage.name}
          />
        )}

        {studentToDelete && (
          <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>학생 삭제 확인</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{studentToDelete.name}</strong> ({studentToDelete.class} {studentToDelete.studentNumber}번) 학생을 정말 삭제하시겠습니까? 이 학생의 모든 운동 기록과 목표도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
