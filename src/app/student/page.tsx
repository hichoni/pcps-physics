
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Target, History, PlusCircle, LogOut, UserCheck, Loader2, AlertTriangle, KeyRound, Edit3, Camera, BarChart3, ImageIcon } from 'lucide-react';
import type { Student, ClassName, Exercise, StudentGoal, RecordedExercise, Gender } from '@/lib/types';
import { EXERCISES } from '@/data/mockData';
import SetStudentGoalsDialog from '@/components/SetStudentGoalsDialog';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ChangeOwnPinDialog from '@/components/ChangeOwnPinDialog';
import ChangeAvatarDialog from '@/components/ChangeAvatarDialog';
import JumpRopeCameraMode from '@/components/JumpRopeCameraMode';
import StudentActivityChart from '@/components/StudentActivityChart';
import { useToast } from "@/hooks/use-toast";
import { recommendStudentExercise, RecommendStudentExerciseOutput } from '@/ai/flows/recommend-student-exercise';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns'; 
import { ko } from 'date-fns/locale';
import NextImage from 'next/image';


const DEFAULT_POSITIVE_ADJECTIVES_KR = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];
const COMPLIMENTS_DOC_PATH = "appConfig/complimentsDoc";

export default function StudentPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassName[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<ClassName | ''>('');
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');
  const [studentForPinCheck, setStudentForPinCheck] = useState<Student | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  const [isLoadingLoginOptions, setIsLoadingLoginOptions] = useState(true);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);

  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isChangeOwnPinDialogOpen, setIsChangeOwnPinDialogOpen] = useState(false); 
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);
  const [studentGoals, setStudentGoals] = useState<StudentGoal>({});
  const [studentActivityLogs, setStudentActivityLogs] = useState<RecordedExercise[]>([]);
  const [recommendedExercise, setRecommendedExercise] = useState<RecommendStudentExerciseOutput | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [dailyCompliment, setDailyCompliment] = useState<string>('');

  const [isCameraModeOpen, setIsCameraModeOpen] = useState(false);
  const [cameraExerciseId, setCameraExerciseId] = useState<string | null>(null);

  const [activityChartTimeFrame, setActivityChartTimeFrame] = useState<'today' | 'week' | 'month'>('today');


  const { toast } = useToast();

  const fetchLoginOptions = useCallback(async () => {
    setIsLoadingLoginOptions(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Student));
      setAllStudents(studentsList);

      const classNames = Array.from(new Set(studentsList.map(s => s.class))).sort();
      setAvailableClasses(classNames);

    } catch (error) {
      console.error("Error fetching login options:", error);
      toast({ title: "오류", description: "학생 정보를 불러오는 데 실패했습니다.", variant: "destructive" });
    } finally {
      setIsLoadingLoginOptions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLoginOptions();
  }, [fetchLoginOptions]);

  const fetchStudentSpecificData = useCallback(async (studentId: string, studentName: string) => {
    if (!studentId) return;
    setIsLoadingStudentData(true);
    try {
      const goalsDocRef = doc(db, "studentGoals", studentId);
      const goalsDocSnap = await getDoc(goalsDocRef);
      if (goalsDocSnap.exists()) {
        setStudentGoals(goalsDocSnap.data().goals || {});
      } else {
        setStudentGoals({});
      }

      const logsQuery = query(collection(db, "exerciseLogs"), where("studentId", "==", studentId));
      const logsSnapshot = await getDocs(logsQuery);
      const logsList = logsSnapshot.docs.map(lDoc => {
        const data = lDoc.data();
        let dateStr = data.date;
        if (data.date && typeof data.date.toDate === 'function') { 
          dateStr = format(data.date.toDate(), "yyyy-MM-dd");
        } else if (typeof data.date === 'string' && data.date.includes('T')) { 
           dateStr = data.date.split('T')[0];
        }
        return { id: lDoc.id, ...data, date: dateStr } as RecordedExercise;
      });
      setStudentActivityLogs(logsList);
      
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const complimentsDocSnap = await getDoc(complimentsDocRef);
      let adjectiveList = DEFAULT_POSITIVE_ADJECTIVES_KR;
      if (complimentsDocSnap.exists() && complimentsDocSnap.data().list && complimentsDocSnap.data().list.length > 0) {
        adjectiveList = complimentsDocSnap.data().list;
      }
      const dayOfMonth = new Date().getDate();
      const adjectiveIndex = (dayOfMonth - 1 + studentName.length) % adjectiveList.length;
      setDailyCompliment(adjectiveList[adjectiveIndex] || adjectiveList[0] || "");

      fetchRecommendation();

    } catch (error) {
      console.error("Error fetching student specific data:", error);
      toast({ title: "오류", description: "학생 데이터를 불러오는 데 실패했습니다.", variant: "destructive" });
    } finally {
      setIsLoadingStudentData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); 


  useEffect(() => {
    if (currentStudent) {
      fetchStudentSpecificData(currentStudent.id, currentStudent.name);
    } else {
      setStudentGoals({}); 
      setStudentActivityLogs([]);
      setRecommendedExercise(null);
      setDailyCompliment('');
    }
  }, [currentStudent, fetchStudentSpecificData]); 

  useEffect(() => {
    if (selectedClass && allStudents.length > 0) {
      setStudentsInClass(allStudents.filter(student => student.class === selectedClass).sort((a,b) => a.studentNumber - b.studentNumber));
      setSelectedStudentId(''); 
      setStudentForPinCheck(null);
      setEnteredPin('');
      setLoginError(null);
    } else {
      setStudentsInClass([]);
    }
  }, [selectedClass, allStudents]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = allStudents.find(s => s.id === studentId);
    setStudentForPinCheck(student || null);
    setEnteredPin('');
    setLoginError(null);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setEnteredPin(value);
      if (loginError) setLoginError(null);
    }
  };

  const handleLoginAttempt = () => {
    if (!studentForPinCheck) {
      setLoginError("학생을 먼저 선택해주세요.");
      return;
    }
    if (!studentForPinCheck.pin) { 
      setLoginError("PIN이 설정되지 않았습니다. 선생님께 문의하세요.");
      return;
    }
    if (enteredPin === studentForPinCheck.pin) {
      setCurrentStudent(studentForPinCheck);
      setLoginError(null);
      setStudentForPinCheck(null); 
      setEnteredPin(''); 
    } else {
      setLoginError("PIN 번호가 올바르지 않습니다. 다시 시도해주세요.");
      setEnteredPin('');
    }
  };

  const fetchRecommendation = async () => {
    setIsRecommendationLoading(true);
    try {
      const recommendation = await recommendStudentExercise();
      setRecommendedExercise(recommendation);
    } catch (error) {
      console.error("AI 추천 가져오기 오류:", error);
      setRecommendedExercise(null); 
    } finally {
      setIsRecommendationLoading(false);
    }
  };

  const handleSaveGoals = async (newGoals: StudentGoal) => {
    if (currentStudent) {
      try {
        const goalsDocRef = doc(db, "studentGoals", currentStudent.id);
        await setDoc(goalsDocRef, { goals: newGoals });
        setStudentGoals(newGoals);
        toast({ title: "성공", description: "운동 목표가 저장되었습니다." });
        setIsGoalsDialogOpen(false);
      } catch (error) {
        console.error("Error saving goals: ", error);
        toast({ title: "오류", description: "운동 목표 저장에 실패했습니다.", variant: "destructive" });
      }
    }
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setSelectedClass('');
    setSelectedStudentId('');
    setStudentForPinCheck(null);
    setEnteredPin('');
    setLoginError(null);
    setIsCameraModeOpen(false);
    setCameraExerciseId(null);
  };

  const handleOpenLogForm = () => {
    if (currentStudent) {
      setIsLogFormOpen(true);
    }
  };

  const handleCloseLogForm = () => {
    setIsLogFormOpen(false);
  };

  const handleSaveExerciseLog = async (logData: Omit<RecordedExercise, 'id'>) => {
    if (!currentStudent) return;
    try {
      const docRef = await addDoc(collection(db, "exerciseLogs"), logData);
      const newLogEntry = { ...logData, id: docRef.id, date: format(parseISO(logData.date), "yyyy-MM-dd") };
      setStudentActivityLogs(prev => [...prev, newLogEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "기록 완료!", description: "오늘의 운동이 성공적으로 기록되었어요! 참 잘했어요!" });
      setIsLogFormOpen(false); 
      setIsCameraModeOpen(false); 
      setCameraExerciseId(null);
    } catch (error) {
      console.error("Error saving exercise log for student: ", error);
      toast({ title: "기록 실패", description: "운동 기록 중 오류가 발생했어요. 다시 시도해주세요.", variant: "destructive" });
    }
  };

  const handleSaveOwnNewPin = async (newPin: string) => {
    if (currentStudent) {
      try {
        const studentDocRef = doc(db, "students", currentStudent.id);
        await updateDoc(studentDocRef, { pin: newPin });
        setCurrentStudent(prev => prev ? { ...prev, pin: newPin } : null);
        toast({ title: "성공", description: "PIN이 성공적으로 변경되었습니다." });
        setIsChangeOwnPinDialogOpen(false);
      } catch (error) {
        console.error("Error updating own PIN:", error);
        toast({ title: "오류", description: "PIN 변경에 실패했습니다. 다시 시도해주세요.", variant: "destructive" });
      }
    }
  };

  const handleSaveAvatar = async (newAvatarId: string) => {
    if (currentStudent) {
      try {
        const studentDocRef = doc(db, "students", currentStudent.id);
        await updateDoc(studentDocRef, { avatarSeed: newAvatarId });
        setCurrentStudent(prev => prev ? { ...prev, avatarSeed: newAvatarId } : null);
        toast({ title: "성공", description: "아바타가 변경되었습니다." });
        setIsChangeAvatarDialogOpen(false);
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast({ title: "오류", description: "아바타 변경에 실패했습니다.", variant: "destructive" });
      }
    }
  };

  const handleSwitchToCameraMode = (exerciseId: string) => {
    setCameraExerciseId(exerciseId);
    setIsLogFormOpen(false); 
    setIsCameraModeOpen(true); 
  };

  const handleCloseCameraMode = () => {
    setIsCameraModeOpen(false);
    setCameraExerciseId(null);
  };

  const handleSaveFromCamera = (count: number) => {
    if (currentStudent && cameraExerciseId === 'ex4') { 
      const logEntry: Omit<RecordedExercise, 'id'> = {
        studentId: currentStudent.id,
        exerciseId: cameraExerciseId,
        date: format(new Date(), "yyyy-MM-dd"), 
        className: currentStudent.class as ClassName,
        countValue: count,
        timeValue: 0, 
      };
      handleSaveExerciseLog(logEntry);
    }
    handleCloseCameraMode();
  };
  
  const hasEffectiveGoals = useMemo(() => {
    return Object.keys(studentGoals).filter(exId => studentGoals[exId] && Object.values(studentGoals[exId]).some(v => v !== undefined && v > 0)).length > 0;
  }, [studentGoals]);

  if (isLoadingLoginOptions) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> 학생 정보 로딩 중...</div>;
  }

  if (!currentStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold font-headline text-primary">학생 로그인</CardTitle>
            <CardDescription>운동 기록을 시작하려면 학급, 이름, PIN을 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">학급 선택</label>
              <Select 
                value={selectedClass} 
                onValueChange={(value) => setSelectedClass(value as ClassName)}
                disabled={availableClasses.length === 0}
              >
                <SelectTrigger id="class-select" className="w-full text-base py-3 rounded-lg">
                  <SelectValue placeholder={availableClasses.length === 0 ? "선생님께서 아직 학급을 만들지 않으셨어요." : "학급을 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map(cls => (
                    <SelectItem key={cls} value={cls} className="text-base py-2">{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">학생 선택</label>
              <Select 
                value={selectedStudentId} 
                onValueChange={handleStudentSelect} 
                disabled={availableClasses.length === 0 || !selectedClass || studentsInClass.length === 0}
              >
                <SelectTrigger id="student-select" className="w-full text-base py-3 rounded-lg">
                  <SelectValue placeholder={
                     availableClasses.length === 0 ? "먼저 학급 정보가 필요합니다." :
                    !selectedClass ? "학급을 먼저 선택하세요" : 
                    (studentsInClass.length === 0 ? "이 학급에 학생 없음" : "학생을 선택하세요")
                  } />
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

            {studentForPinCheck && (
              <div className="space-y-2">
                <label htmlFor="pin-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  PIN (4자리 숫자)
                </label>
                <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <Input
                      id="pin-input"
                      type="password"
                      value={enteredPin}
                      onChange={handlePinChange}
                      maxLength={4}
                      placeholder="PIN 입력"
                      className="text-base py-3 rounded-lg tracking-widest flex-grow"
                      onKeyDown={(e) => e.key === 'Enter' && handleLoginAttempt()}
                    />
                </div>
              </div>
            )}

            {loginError && (
              <p className="text-sm text-destructive text-center">{loginError}</p>
            )}

            <Button onClick={handleLoginAttempt} disabled={!selectedStudentId || (studentForPinCheck && enteredPin.length !== 4)} className="w-full py-3 text-lg rounded-lg">
              <UserCheck className="mr-2 h-5 w-5" />
              로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingStudentData) {
     return (
      <div className="flex flex-col min-h-screen">
        <StudentHeader 
          studentName={currentStudent.name} 
          gender={currentStudent.gender}
          avatarId={currentStudent.avatarSeed}
          onChangeAvatar={() => setIsChangeAvatarDialogOpen(true)}
          dailyCompliment={dailyCompliment}
        />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-4 text-xl">{currentStudent.name} 학생의 데이터를 불러오는 중...</span>
        </main>
         <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          &copy; {new Date().getFullYear()} {currentStudent.name}의 운동기록장.
        </footer>
      </div>
    );
  }

  if (isCameraModeOpen) {
    return (
      <JumpRopeCameraMode
        onClose={handleCloseCameraMode}
        onSave={handleSaveFromCamera}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <StudentHeader 
        studentName={currentStudent.name} 
        gender={currentStudent.gender}
        avatarId={currentStudent.avatarSeed}
        onChangeAvatar={() => setIsChangeAvatarDialogOpen(true)}
        dailyCompliment={dailyCompliment}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        <section className="bg-card p-6 sm:p-8 rounded-xl shadow-lg flex flex-col justify-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-headline text-primary mb-3 text-center lg:text-left">
              {currentStudent.name}님, 안녕하세요!
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 text-center lg:text-left">
              오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
              <Button size="lg" className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0" onClick={handleOpenLogForm}>
                <PlusCircle className="mr-2 h-6 w-6" />
                새로운 운동 기록하기
              </Button>
              {currentStudent.pin === "0000" && (
                <Button variant="outline" size="lg" className="rounded-lg py-3 px-6 text-lg border-accent text-accent hover:bg-accent/10 flex-grow sm:flex-grow-0" onClick={() => setIsChangeOwnPinDialogOpen(true)}>
                  <Edit3 className="mr-2 h-5 w-5" />
                  PIN 변경하기
                </Button>
              )}
            </div>
              {currentStudent.pin === "0000" && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-center lg:text-left">
                <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                보안을 위해 초기 PIN "0000"을 변경해주세요.
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl lg:col-span-3 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Target className="mr-3 h-7 w-7 text-accent" />
                나의 운동 목표
              </CardTitle>
              <CardDescription>목표를 설정하고 달성해봐요!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow flex flex-col">
              {hasEffectiveGoals ? (
                 <div className="flex items-center justify-center min-h-[10rem] bg-secondary/20 rounded-lg p-3 flex-grow">
                  <ul className="text-sm list-disc list-inside pl-2 text-left w-full overflow-y-auto max-h-full">
                    {EXERCISES.filter(ex => studentGoals[ex.id] && Object.values(studentGoals[ex.id]).some(v => v !== undefined && v > 0) ).map(exercise => {
                      const goal = studentGoals[exercise.id];
                      let goalText = `${exercise.koreanName}: `;
                      const parts = [];
                      if (exercise.category === 'count_time') {
                        if (goal?.count) parts.push(`${goal.count}${exercise.countUnit || ''}`);
                        if (goal?.time) parts.push(`${goal.time}${exercise.timeUnit || ''}`);
                      } else if (exercise.category === 'steps_distance') {
                        if (goal?.steps) parts.push(`${goal.steps}${exercise.stepsUnit || ''}`);
                        if (goal?.distance) parts.push(`${goal.distance}${exercise.distanceUnit || ''}`);
                      }
                      goalText += parts.join(', ');
                      return <li key={exercise.id} className="truncate py-0.5" title={goalText}>{goalText}</li>;
                    })}
                  </ul>
                </div>
              ) : (
                 <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">나의 운동 목표를 설정해봐요!</p>
                </div>
              )}
              <Button variant="outline" className="w-full rounded-lg mt-auto py-3 text-base" onClick={() => setIsGoalsDialogOpen(true)}>목표 설정/확인</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Dumbbell className="mr-3 h-7 w-7 text-primary" />
                오늘의 추천 운동/팁
              </CardTitle>
              <CardDescription>AI 코치가 추천하는 활동을 확인해보세요!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow flex flex-col">
              <div className="flex flex-col items-center justify-center min-h-[10rem] bg-secondary/20 rounded-lg p-4 text-center overflow-y-auto flex-grow">
                {isRecommendationLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : recommendedExercise ? (
                  <>
                    <h4 className="font-semibold text-primary mb-1 text-lg">{recommendedExercise.recommendationTitle}</h4>
                    <p className="text-sm text-foreground/80">{recommendedExercise.recommendationDetail}</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                     <AlertTriangle className="h-8 w-8 mb-2" />
                    <p>추천을 불러오지 못했어요.</p>
                    <Button variant="link" size="sm" onClick={fetchRecommendation} className="mt-1">다시 시도</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center">
                <History className="mr-3 h-7 w-7 text-destructive" />
                <div>
                    <CardTitle className="font-headline text-xl">나의 활동 내역</CardTitle>
                    <CardDescription>선택한 기간의 운동 기록을 확인하고, 최근 활동도 살펴봐요.</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-center shrink-0">
                {(['today', 'week', 'month'] as const).map((frame) => (
                  <Button
                    key={frame}
                    variant={activityChartTimeFrame === frame ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivityChartTimeFrame(frame)}
                    className="rounded-md px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {frame === 'today' && '오늘'}
                    {frame === 'week' && '주간'}
                    {frame === 'month' && '월간'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <StudentActivityChart logs={studentActivityLogs} timeFrame={activityChartTimeFrame} />
            
            <h4 className="text-md font-semibold pt-6 border-t mt-8">최근 5개 활동:</h4>
            {studentActivityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">기록된 활동이 없습니다.</p>
            ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 bg-secondary/20 rounded-lg text-sm">
                  {studentActivityLogs
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0))
                      .slice(0, 5) 
                      .map(log => {
                          const exerciseInfo = EXERCISES.find(ex => ex.id === log.exerciseId);
                          if (!exerciseInfo) return null;
                          let valueDisplay = "";
                          if (exerciseInfo.category === 'count_time') {
                              if (log.countValue !== undefined && log.countValue > 0) valueDisplay += `${log.countValue}${exerciseInfo.countUnit || ''} `;
                              if (log.timeValue !== undefined && log.timeValue > 0) valueDisplay += `${log.timeValue}${exerciseInfo.timeUnit || ''}`;
                          } else if (exerciseInfo.category === 'steps_distance') {
                              if (log.stepsValue !== undefined && log.stepsValue > 0) valueDisplay += `${log.stepsValue}${exerciseInfo.stepsUnit || ''} `;
                              if (log.distanceValue !== undefined && log.distanceValue > 0) valueDisplay += `${log.distanceValue}${exerciseInfo.distanceUnit || ''}`;
                          }
                          valueDisplay = valueDisplay.trim();
                          if (!valueDisplay) valueDisplay = "기록됨"; 

                          return (
                              <div key={log.id} className="p-2 bg-background/50 rounded text-xs flex items-center justify-between">
                                  <span>{format(parseISO(log.date), "MM/dd (EEE)", { locale: ko })}: {exerciseInfo.koreanName} - {valueDisplay}</span>
                                  {log.imageUrl && (
                                    <a href={log.imageUrl} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0">
                                      <NextImage 
                                        src={log.imageUrl} 
                                        alt="인증샷" 
                                        width={32} 
                                        height={32} 
                                        className="rounded object-cover border"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none'; 
                                          const parent = target.parentElement;
                                          if (parent && !parent.querySelector('.image-error-placeholder-thumb')) {
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'image-error-placeholder-thumb w-8 h-8 flex items-center justify-center bg-muted text-muted-foreground text-[10px]';
                                            placeholder.textContent = 'X';
                                            parent.appendChild(placeholder);
                                          }
                                        }}
                                      />
                                    </a>
                                  )}
                              </div>
                          );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8">
            <Button variant="outline" size="lg" onClick={handleLogout} className="rounded-lg py-3 px-6 text-lg w-full">
              <LogOut className="mr-2 h-6 w-6" />
              로그아웃
            </Button>
        </div>

        {currentStudent && (
          <ExerciseLogForm
            student={currentStudent}
            isOpen={isLogFormOpen}
            onClose={handleCloseLogForm}
            onSave={handleSaveExerciseLog}
            recordedExercises={studentActivityLogs} 
            onSwitchToCameraMode={handleSwitchToCameraMode}
          />
        )}

        <SetStudentGoalsDialog
          isOpen={isGoalsDialogOpen}
          onClose={() => setIsGoalsDialogOpen(false)}
          onSave={handleSaveGoals}
          exercises={EXERCISES}
          currentStudent={currentStudent}
          initialGoals={studentGoals}
        />

        {currentStudent && (
          <ChangeOwnPinDialog
            isOpen={isChangeOwnPinDialogOpen}
            onClose={() => setIsChangeOwnPinDialogOpen(false)}
            onSave={handleSaveOwnNewPin}
          />
        )}

        {currentStudent && (
          <ChangeAvatarDialog
            isOpen={isChangeAvatarDialogOpen}
            onClose={() => setIsChangeAvatarDialogOpen(false)}
            onSave={handleSaveAvatar}
            currentAvatarId={currentStudent.avatarSeed}
          />
        )}

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} {currentStudent.name}의 운동기록장. 매일매일 건강하게!
      </footer>
    </div>
  );
}
    

    