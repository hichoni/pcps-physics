
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Target, History, PlusCircle, LogOut, UserCheck, Loader2, AlertTriangle, KeyRound, Edit3, Camera, ImageIcon, CheckSquare, PlusSquare, Trash2, Leaf, Droplets, Sprout, Star, Footprints, Trophy, Zap, Medal, ShieldCheck, Crown, Gem } from 'lucide-react';
import type { Student, ClassName, RecordedExercise, Gender, StudentGoal, CustomExercise as CustomExerciseType, Exercise as ExerciseType, LevelInfo } from '@/lib/types';
import { EXERCISES_SEED_DATA } from '@/data/mockData';
import SetStudentGoalsDialog from '@/components/SetStudentGoalsDialog';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ChangeOwnPinDialog from '@/components/ChangeOwnPinDialog';
import ChangeAvatarDialog from '@/components/ChangeAvatarDialog';
import UploadProofShotDialog from '@/components/UploadProofShotDialog';
import JumpRopeCameraMode from '@/components/JumpRopeCameraMode';
import StudentActivityChart from '@/components/StudentActivityChart';
import { useToast } from "@/hooks/use-toast";
import { recommendStudentExercise, RecommendStudentExerciseOutput } from '@/ai/flows/recommend-student-exercise';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { format, parseISO, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';

const DEFAULT_POSITIVE_ADJECTIVES_KR = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];
const COMPLIMENTS_DOC_PATH = "appConfig/complimentsDoc";
const STUDENT_WELCOME_MESSAGE_DOC_PATH = "appConfig/studentWelcomeMessageDoc";
const DEFAULT_STUDENT_WELCOME_MESSAGE = "오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?";
const CUSTOM_EXERCISES_DOC_PATH = "appConfig/customExercisesDoc";

const LEVEL_TIERS: LevelInfo[] = [
  { level: 1, name: "움직새싹", icon: Leaf, minXp: 0, maxXp: 200, colorClass: "text-green-500 dark:text-green-400" },
  { level: 2, name: "땀방울 초보", icon: Droplets, minXp: 200, maxXp: 400, colorClass: "text-sky-500 dark:text-sky-400" },
  { level: 3, name: "체력 꿈나무", icon: Sprout, minXp: 400, maxXp: 600, colorClass: "text-lime-500 dark:text-lime-400" },
  { level: 4, name: "체력 유망주", icon: Star, minXp: 600, maxXp: 800, colorClass: "text-yellow-500 dark:text-yellow-400" },
  { level: 5, name: "달리기 선수", icon: Footprints, minXp: 800, maxXp: 1000, colorClass: "text-orange-500 dark:text-orange-400" },
  { level: 6, name: "운동 챌린저", icon: Trophy, minXp: 1000, maxXp: 1200, colorClass: "text-amber-500 dark:text-amber-400" },
  { level: 7, name: "에너지 파이터", icon: Zap, minXp: 1200, maxXp: 1400, colorClass: "text-blue-600 dark:text-blue-400" },
  { level: 8, name: "체력 마스터", icon: Medal, minXp: 1400, maxXp: 1600, colorClass: "text-purple-500 dark:text-purple-400" },
  { level: 9, name: "피트니스 히어로", icon: ShieldCheck, minXp: 1600, maxXp: 1800, colorClass: "text-red-500 dark:text-red-400" },
  { level: 10, name: "전설의 운동왕", icon: Crown, minXp: 1800, maxXp: Infinity, colorClass: "text-fuchsia-500 dark:text-fuchsia-400" },
];

const calculateLevelInfo = (xp: number = 0): LevelInfo => {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      return LEVEL_TIERS[i];
    }
  }
  return LEVEL_TIERS[0]; 
};

const convertCustomToInternalExercise = (customEx: CustomExerciseType): ExerciseType => {
  return {
    ...customEx,
    icon: getIconByName(customEx.iconName),
  };
};

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
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isStudentActivityLogsLoading, setIsStudentActivityLogsLoading] = useState(true);
  const [canShowProofShotSection, setCanShowProofShotSection] = useState(false);


  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isChangeOwnPinDialogOpen, setIsChangeOwnPinDialogOpen] = useState(false);
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);
  const [isUploadProofShotDialogOpen, setIsUploadProofShotDialogOpen] = useState(false);

  const [studentGoals, setStudentGoals] = useState<StudentGoal>({});
  const [studentActivityLogs, setStudentActivityLogs] = useState<RecordedExercise[]>([]);
  const [recommendedExercise, setRecommendedExercise] = useState<RecommendStudentExerciseOutput | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [dailyCompliment, setDailyCompliment] = useState<string>('');
  const [studentWelcomeMessage, setStudentWelcomeMessage] = useState<string>(DEFAULT_STUDENT_WELCOME_MESSAGE);

  const [availableExercises, setAvailableExercises] = useState<ExerciseType[]>([]);
  const [goalsMetTodayForXp, setGoalsMetTodayForXp] = useState<Set<string>>(new Set());
  const [deleteTrigger, setDeleteTrigger] = useState(0);


  const [isCameraModeOpen, setIsCameraModeOpen] = useState(false);
  const [cameraExerciseId, setCameraExerciseId] = useState<string | null>(null);

  const [activityChartTimeFrame, setActivityChartTimeFrame] = useState<'today' | 'week' | 'month'>('today');

  const { toast } = useToast();

  const fetchLoginOptions = useCallback(async () => {
    setIsLoadingLoginOptions(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(sDoc => {
        const data = sDoc.data();
        return { id: sDoc.id, ...data, totalXp: data.totalXp || 0 } as Student;
      });
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

  useEffect(() => {
    setIsLoadingExercises(true);
    const exercisesDocRef = doc(db, CUSTOM_EXERCISES_DOC_PATH);
    const unsubscribe = onSnapshot(exercisesDocRef, (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data()?.list)) {
        const customExercisesFromDb = docSnap.data()?.list as CustomExerciseType[];
        const allowedExercises = customExercisesFromDb
          .filter(ex => ['squat', 'plank', 'walk_run', 'jump_rope'].includes(ex.id))
          .map(convertCustomToInternalExercise);

        if (allowedExercises.length < 4 && customExercisesFromDb.length > 0) {
            const seededByName = EXERCISES_SEED_DATA.map(seedEx => {
                const dbMatch = customExercisesFromDb.find(dbEx => dbEx.koreanName === seedEx.koreanName);
                return dbMatch ? convertCustomToInternalExercise(dbMatch) : convertCustomToInternalExercise(seedEx);
            });
            setAvailableExercises(seededByName);
             toast({ title: "알림", description: "운동 목록을 조정했습니다. 일부 운동은 기본값으로 설정될 수 있습니다.", variant: "default" });
        } else if (allowedExercises.length === 4) {
            setAvailableExercises(allowedExercises);
        }
         else {
          toast({ title: "알림", description: "기본 운동 목록을 사용합니다. 교사가 운동 목록을 설정할 수 있습니다.", variant: "default" });
          setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
        }
      } else {
        toast({ title: "알림", description: "기본 운동 목록을 사용합니다. 교사가 운동 목록을 설정할 수 있습니다.", variant: "default" });
        setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
      }
      setIsLoadingExercises(false);
    }, (error) => {
      console.error("Error fetching custom exercises:", error);
      toast({ title: "오류", description: "운동 목록 로딩에 실패했습니다. 기본 목록을 사용합니다.", variant: "destructive" });
      setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
      setIsLoadingExercises(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const fetchRecommendation = useCallback(async () => {
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
  }, []);

  const fetchStudentSpecificData = useCallback(async (studentId: string, studentName: string, currentExercises: ExerciseType[]) => {
    if (!studentId) return;
    setIsLoadingStudentData(true); 
    
    let unsubscribeLogs: (() => void) | undefined;

    try {
      const goalsDocRef = doc(db, "studentGoals", studentId);
      const goalsDocSnap = await getDoc(goalsDocRef);
      const fetchedGoals = goalsDocSnap.exists() ? (goalsDocSnap.data().goals || {}) : {};
      setStudentGoals(fetchedGoals);

      const logsQuery = query(collection(db, "exerciseLogs"), where("studentId", "==", studentId));
      unsubscribeLogs = onSnapshot(logsQuery, (logsSnapshot) => {
        const logsList = logsSnapshot.docs.map(lDoc => {
          const data = lDoc.data();
          let dateStr = data.date;
          if (data.date && typeof data.date.toDate === 'function') {
            dateStr = format(data.date.toDate(), "yyyy-MM-dd");
          } else if (typeof data.date === 'string' && data.date.includes('T')) {
             dateStr = data.date.split('T')[0];
          }
          return { 
            id: lDoc.id, 
            ...data, 
            date: dateStr, 
            imageUrl: data.imageUrl ?? null 
          } as RecordedExercise;
        });
        const sortedLogs = logsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0));
        setStudentActivityLogs(sortedLogs);

        const todayImage = sortedLogs
            .filter(log => log.studentId === studentId && isToday(parseISO(log.date)) && log.imageUrl)
            .sort((a, b) => (b.id && a.id ? b.id.localeCompare(a.id) : 0))[0] || null;
        const anyLogTodayForStudent = sortedLogs.some(log => log.studentId === studentId && isToday(parseISO(log.date)));
        setCanShowProofShotSection(!!todayImage || anyLogTodayForStudent);

        const today = format(new Date(), "yyyy-MM-dd");
        const metToday = new Set<string>();
        currentExercises.forEach(exercise => {
          const goalData = fetchedGoals[exercise.id];
          if (!goalData) return;

          const logsForExerciseToday = sortedLogs.filter(
            log => log.studentId === studentId && log.exerciseId === exercise.id && log.date === today
          );

          let achievedValue = 0;
          let currentGoalValue: number | undefined;

          if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
            achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.countValue || 0), 0);
            currentGoalValue = goalData.count;
          } else if (exercise.id === 'plank') {
            achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.timeValue || 0), 0);
            currentGoalValue = goalData.time;
          } else if (exercise.id === 'walk_run') {
            achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
            currentGoalValue = goalData.distance;
          }

          if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
            metToday.add(exercise.id);
          }
        });
        setGoalsMetTodayForXp(metToday);
        setIsStudentActivityLogsLoading(false); 
      }, (error) => {
        console.error("Error fetching student logs in real-time:", error);
        toast({ title: "오류", description: "운동 기록 실시간 업데이트에 실패했습니다.", variant: "destructive" });
        setIsStudentActivityLogsLoading(false); 
        setCanShowProofShotSection(false);
      });

      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const complimentsDocSnap = await getDoc(complimentsDocRef);
      let adjectiveList = DEFAULT_POSITIVE_ADJECTIVES_KR;
      if (complimentsDocSnap.exists() && complimentsDocSnap.data().list && complimentsDocSnap.data().list.length > 0) {
        adjectiveList = complimentsDocSnap.data().list;
      }
      const dayOfMonth = new Date().getDate();
      const adjectiveIndex = (dayOfMonth - 1 + studentName.length) % adjectiveList.length;
      setDailyCompliment(adjectiveList[adjectiveIndex] || adjectiveList[0] || "");

      const welcomeMsgDocRef = doc(db, STUDENT_WELCOME_MESSAGE_DOC_PATH);
      const welcomeMsgDocSnap = await getDoc(welcomeMsgDocRef);
      if (welcomeMsgDocSnap.exists() && welcomeMsgDocSnap.data().text) {
        setStudentWelcomeMessage(welcomeMsgDocSnap.data().text);
      } else {
        setStudentWelcomeMessage(DEFAULT_STUDENT_WELCOME_MESSAGE);
      }
      fetchRecommendation();
    } catch (error) {
      console.error("Error fetching student specific data:", error);
      toast({ title: "오류", description: "학생 데이터를 불러오는 데 실패했습니다.", variant: "destructive" });
      setIsStudentActivityLogsLoading(false); 
      setCanShowProofShotSection(false);
    } finally {
      setIsLoadingStudentData(false); 
    }
    return unsubscribeLogs;
  }, [toast, fetchRecommendation]);
  
  useEffect(() => {
    let unsubscribeLogsFunction: (() => void) | undefined;
    if (currentStudent) {
        setDeleteTrigger(0); 
        setIsStudentActivityLogsLoading(true); 
        setCanShowProofShotSection(false); 
        if (availableExercises.length > 0) {
            fetchStudentSpecificData(currentStudent.id, currentStudent.name, availableExercises)
              .then(unsub => {
                if (unsub) unsubscribeLogsFunction = unsub;
              });
        } else {
            setIsStudentActivityLogsLoading(false); 
            setCanShowProofShotSection(false);
            setStudentActivityLogs([]); 
        }
    } else { 
      setStudentGoals({});
      setStudentActivityLogs([]);
      setRecommendedExercise(null);
      setDailyCompliment('');
      setStudentWelcomeMessage(DEFAULT_STUDENT_WELCOME_MESSAGE);
      setGoalsMetTodayForXp(new Set());
      setIsStudentActivityLogsLoading(true); 
      setCanShowProofShotSection(false);
    }
    return () => {
      if (unsubscribeLogsFunction) {
        unsubscribeLogsFunction();
      }
    };
  }, [currentStudent, availableExercises, fetchStudentSpecificData]);


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

  const handleSaveGoals = async (newGoals: StudentGoal) => {
    if (currentStudent) {
      try {
        const goalsDocRef = doc(db, "studentGoals", currentStudent.id);
        await setDoc(goalsDocRef, { goals: newGoals });
        setStudentGoals(newGoals);
        toast({ title: "성공", description: "운동 목표가 저장되었습니다." });
        setIsGoalsDialogOpen(false);

        const today = format(new Date(), "yyyy-MM-dd");
        const metToday = new Set<string>();
        availableExercises.forEach(exercise => {
          const goalData = newGoals[exercise.id];
          if (!goalData) return;
          const logsForExerciseToday = studentActivityLogs.filter(
            log => log.studentId === currentStudent.id && log.exerciseId === exercise.id && log.date === today
          );
          let achievedValue = 0;
          let currentGoalValue: number | undefined;
          if (exercise.id === 'squat' || exercise.id === 'jump_rope') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.countValue || 0), 0); currentGoalValue = goalData.count; }
          else if (exercise.id === 'plank') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.timeValue || 0), 0); currentGoalValue = goalData.time; }
          else if (exercise.id === 'walk_run') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.distanceValue || 0), 0); currentGoalValue = goalData.distance; }
          if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) { metToday.add(exercise.id); }
        });
        setGoalsMetTodayForXp(metToday);

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
      if (availableExercises.length === 0) {
        toast({ title: "알림", description: "선생님께서 아직 운동을 설정하지 않으셨어요.", variant: "default"});
        return;
      }
      setIsLogFormOpen(true);
    }
  };

  const handleCloseLogForm = () => {
    setIsLogFormOpen(false);
  };

  const handleSaveExerciseLog = async (logData: Omit<RecordedExercise, 'id' | 'imageUrl'>) => {
    if (!currentStudent || !availableExercises) return;
    try {
      const docRef = await addDoc(collection(db, "exerciseLogs"), logData);

      toast({ title: "기록 완료!", description: "오늘의 운동이 성공적으로 기록되었어요! 참 잘했어요!" });
      setIsLogFormOpen(false);
      setIsCameraModeOpen(false);
      setCameraExerciseId(null);

      const exerciseId = logData.exerciseId;
      const exercise = availableExercises.find(ex => ex.id === exerciseId);

      if (exercise && !goalsMetTodayForXp.has(exerciseId)) {
        const today = format(new Date(), "yyyy-MM-dd");

        const logsQuery = query(collection(db, "exerciseLogs"),
          where("studentId", "==", currentStudent.id),
          where("exerciseId", "==", exerciseId),
          where("date", "==", today)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logsForExerciseToday = logsSnapshot.docs.map(d => d.data() as RecordedExercise);
        const combinedLogs = [...logsForExerciseToday, { ...logData, id: docRef.id, imageUrl: null }];


        let achievedValue = 0;
        if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
        } else if (exercise.id === 'plank') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);
        } else if (exercise.id === 'walk_run') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
        }

        const goalData = studentGoals[exerciseId];
        let currentGoalValue: number | undefined;
        if (goalData) {
          if (exercise.id === 'squat' || exercise.id === 'jump_rope') currentGoalValue = goalData.count;
          else if (exercise.id === 'plank') currentGoalValue = goalData.time;
          else if (exercise.id === 'walk_run') currentGoalValue = goalData.distance;
        }

        if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
          const oldXp = currentStudent.totalXp || 0;
          const newTotalXp = oldXp + 10;
          const studentDocRef = doc(db, "students", currentStudent.id);
          await updateDoc(studentDocRef, { totalXp: newTotalXp });

          setCurrentStudent(prev => prev ? { ...prev, totalXp: newTotalXp } : null);
          setGoalsMetTodayForXp(prev => new Set(prev).add(exerciseId));

          toast({ title: "✨ XP 획득! ✨", description: `${exercise.koreanName} 목표 달성! +10 XP` });

          const oldLevelInfo = calculateLevelInfo(oldXp);
          const newLevelInfo = calculateLevelInfo(newTotalXp);
          if (newLevelInfo.level > oldLevelInfo.level) {
            toast({ title: "🎉 레벨 업! 🎉", description: `축하합니다! ${newLevelInfo.name}(으)로 레벨 업!`, duration: 7000 });
          }
        }
      }

    } catch (error) {
      console.error("Error saving exercise log for student: ", error);
      toast({ title: "기록 실패", description: "운동 기록 중 오류가 발생했어요. 다시 시도해주세요.", variant: "destructive" });
    }
  };

  const handleProofShotUploadComplete = (logId: string, imageUrl: string) => {
    setStudentActivityLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === logId ? { ...log, imageUrl: imageUrl } : log
      )
    );
    // setDeleteTrigger(prev => prev + 1); // No longer relying on deleteTrigger for this
  };

  const handleDeleteProofShot = async (logId: string) => {
    if (!currentStudent) return;
    const confirmDelete = window.confirm("정말로 이 인증샷을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (!confirmDelete) return;

    try {
        const logDocRef = doc(db, "exerciseLogs", logId);
        await updateDoc(logDocRef, { imageUrl: null }); 

        // Optimistic update locally
        setStudentActivityLogs(prevLogs =>
            prevLogs.map(log =>
                log.id === logId ? { ...log, imageUrl: null } : log
            )
        );
        
        // Re-evaluate if the proof shot section should be shown
        const updatedLogs = studentActivityLogs.map(log => log.id === logId ? { ...log, imageUrl: null } : log);
        const todayImage = updatedLogs
            .filter(log => log.studentId === currentStudent.id && isToday(parseISO(log.date)) && log.imageUrl)
            .sort((a, b) => (b.id && a.id ? b.id.localeCompare(a.id) : 0))[0] || null;
        const anyLogTodayForStudent = updatedLogs.some(log => log.studentId === currentStudent.id && isToday(parseISO(log.date)));
        setCanShowProofShotSection(!!todayImage || anyLogTodayForStudent);

        toast({ title: "성공", description: "인증샷이 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting proof shot:", error);
        toast({ title: "오류", description: "인증샷 삭제에 실패했습니다.", variant: "destructive" });
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
    if (currentStudent && cameraExerciseId) {
      const exerciseDetails = availableExercises.find(ex => ex.id === cameraExerciseId);
      if (exerciseDetails && exerciseDetails.id === 'jump_rope') {
        const logEntry: Omit<RecordedExercise, 'id' | 'imageUrl'> = {
          studentId: currentStudent.id,
          exerciseId: cameraExerciseId,
          date: format(new Date(), "yyyy-MM-dd"),
          className: currentStudent.class as ClassName,
          countValue: count,
        };
        handleSaveExerciseLog(logEntry);
      } else {
        toast({title: "알림", description: "카메라 기록은 줄넘기 운동 전용입니다.", variant: "default"});
      }
    }
    handleCloseCameraMode();
  };

  const hasEffectiveGoals = useMemo(() => {
    return Object.keys(studentGoals).filter(exId => {
      const goal = studentGoals[exId];
      if (!goal) return false;
      const exercise = availableExercises.find(e => e.id === exId);
      if (!exercise) return false;
      if ((exercise.id === 'squat' || exercise.id === 'jump_rope') && goal.count && goal.count > 0) return true;
      if (exercise.id === 'plank' && goal.time && goal.time > 0) return true;
      if (exercise.id === 'walk_run' && goal.distance && goal.distance > 0) return true;
      return false;
    }).length > 0;
  }, [studentGoals, availableExercises]);

  const latestTodayImage = useMemo(() => {
    if (!currentStudent || studentActivityLogs.length === 0) return null;
    const todayLogsWithImages = studentActivityLogs
      .filter(log => log.studentId === currentStudent.id && isToday(parseISO(log.date)) && log.imageUrl)
      .sort((a, b) => {
        if (a.id && b.id) return b.id.localeCompare(a.id); // More recent logs first by ID if dates are same
        return 0;
      });
    return todayLogsWithImages.length > 0 ? todayLogsWithImages[0] : null;
  }, [currentStudent, studentActivityLogs]);
  
  const hasAnyLogForToday = useMemo(() => {
    if (!currentStudent || studentActivityLogs.length === 0) return false;
    return studentActivityLogs.some(log => log.studentId === currentStudent.id && isToday(parseISO(log.date)));
  }, [currentStudent, studentActivityLogs]);

  const shouldShowUploadButton = !isStudentActivityLogsLoading && !latestTodayImage && hasAnyLogForToday;


  const getExerciseProgressText = useCallback((exerciseId: string): string => {
    if (!currentStudent) return "";
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return "";

    const goal = studentGoals[exerciseId];
    if (!goal) return "";

    const logsForToday = studentActivityLogs.filter(log => log.studentId === currentStudent.id && log.exerciseId === exerciseId && isToday(parseISO(log.date)));

    let achievedValue = 0;
    let goalValue = 0;
    let unit = "";

    if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
      achievedValue = logsForToday.reduce((sum, log) => sum + (log.countValue || 0), 0);
      goalValue = goal.count || 0;
      unit = exercise.countUnit || "";
    } else if (exercise.id === 'plank') {
      achievedValue = logsForToday.reduce((sum, log) => sum + (log.timeValue || 0), 0);
      goalValue = goal.time || 0;
      unit = exercise.timeUnit || "";
    } else if (exercise.id === 'walk_run') {
      achievedValue = logsForToday.reduce((sum, log) => sum + (log.distanceValue || 0), 0);
      goalValue = goal.distance || 0;
      unit = exercise.distanceUnit || "";
    }

    if (goalValue > 0) {
      const percent = Math.min(100, Math.round((achievedValue / goalValue) * 100));
      return `오늘 ${achievedValue}${unit} / 목표 ${goalValue}${unit} (${percent}%)`;
    }
    return "";
  }, [studentGoals, studentActivityLogs, currentStudent, availableExercises]);

  const currentLevelInfo = useMemo(() => {
    return calculateLevelInfo(currentStudent?.totalXp);
  }, [currentStudent?.totalXp]);

  const xpProgress = useMemo(() => {
    if (!currentStudent || currentLevelInfo.level === 10) return 100;
    const xpInCurrentLevel = (currentStudent.totalXp || 0) - currentLevelInfo.minXp;
    const xpForNextLevel = currentLevelInfo.maxXp - currentLevelInfo.minXp;
    return xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;
  }, [currentStudent, currentLevelInfo]);


  if (isLoadingLoginOptions || isLoadingExercises) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> {isLoadingLoginOptions ? '학생 정보' : '운동 목록'} 로딩 중...</div>;
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

  if (isLoadingStudentData || (currentStudent && isStudentActivityLogsLoading && availableExercises.length === 0) ) { 
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
        exerciseIdForCamera={'jump_rope'}
      />
    );
  }

  const LevelIcon = currentLevelInfo.icon || Gem;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
             <Card className={cn(
                "shadow-lg rounded-xl flex flex-col",
                (isStudentActivityLogsLoading || !canShowProofShotSection) ? "lg:col-span-3" : "lg:col-span-2"
            )}>
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary text-center lg:text-left">
                    {currentStudent.name}님, 안녕하세요!
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                    <div>
                        <p className="text-base sm:text-lg text-muted-foreground mb-6 text-center lg:text-left">
                            {studentWelcomeMessage}
                        </p>
                    </div>

                    <div className="mb-6 p-4 border rounded-lg shadow-inner bg-secondary/20 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                              <LevelIcon className={cn("h-10 w-10 mr-3", currentLevelInfo.colorClass)} />
                              <div>
                                  <p className={cn("text-xl font-bold", currentLevelInfo.colorClass)}>{currentLevelInfo.name}</p>
                                  <p className="text-xs text-muted-foreground">레벨 {currentLevelInfo.level}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-lg font-semibold text-amber-500 dark:text-amber-400">{(currentStudent.totalXp || 0).toLocaleString()} XP</p>
                              {currentLevelInfo.level < 10 && (
                                 <p className="text-xs text-muted-foreground">다음 레벨까지 {Math.max(0, currentLevelInfo.maxXp - (currentStudent.totalXp || 0))} XP</p>
                              )}
                          </div>
                      </div>
                      {currentLevelInfo.level < 10 && (
                        <Progress value={xpProgress} className="h-3 rounded-full" indicatorClassName={currentLevelInfo.colorClass.replace('text-', 'bg-')}/>
                      )}
                       {currentLevelInfo.level === 10 && (
                        <p className="text-center text-sm font-medium text-fuchsia-500 dark:text-fuchsia-400 mt-2">최고 레벨 달성! 🎉</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center mt-auto">
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
                </CardContent>
            </Card>
            
            { isStudentActivityLogsLoading && ( 
                 <div className="lg:col-span-1">
                    <Card className="shadow-lg rounded-xl flex flex-col h-full items-center justify-center">
                        <CardContent className="p-6 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground mt-2">오늘 활동 로딩 중...</p>
                        </CardContent>
                    </Card>
                 </div>
            )}
            { !isStudentActivityLogsLoading && canShowProofShotSection && (
              <div
                key={`proof-shot-area-${currentStudent?.id}-${latestTodayImage?.id || 'no-image'}-${shouldShowUploadButton}`}
                className="lg:col-span-1"
              >
                  {latestTodayImage ? (
                      <Card className="shadow-lg rounded-xl flex flex-col h-full">
                      <CardHeader className="pb-2 pt-4">
                          <CardTitle className="flex items-center font-headline text-xl justify-center">
                            <CheckSquare className="mr-3 h-7 w-7 text-green-500" />
                            오.운.완!
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col items-center justify-center p-3 space-y-2">
                          <a href={latestTodayImage.imageUrl!} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square relative rounded-lg overflow-hidden shadow-inner bg-muted">
                          <NextImage
                              key={latestTodayImage.imageUrl} 
                              src={latestTodayImage.imageUrl!}
                              alt="오늘의 운동 인증샷"
                              layout="fill"
                              objectFit="cover"
                              className="transition-transform duration-300 hover:scale-105"
                              data-ai-hint="fitness activity"
                              onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.image-error-placeholder-student')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'image-error-placeholder-student absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs p-2 text-center';
                                  placeholder.textContent = '이미지를 불러올 수 없습니다.';
                                  parent.appendChild(placeholder);
                              }
                              }}
                          />
                          </a>
                          <Button
                              variant="destructive"
                              size="sm"
                              className="w-full rounded-md text-xs py-1.5 h-auto"
                              onClick={() => handleDeleteProofShot(latestTodayImage.id!)}
                          >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              인증샷 삭제
                          </Button>
                      </CardContent>
                      </Card>
                  ) : shouldShowUploadButton ? ( 
                      <Card
                          className="shadow-lg rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors h-full"
                          onClick={() => setIsUploadProofShotDialogOpen(true)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsUploadProofShotDialogOpen(true);}}
                          aria-label="오늘 운동 인증샷 추가하기"
                      >
                          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                              <PlusSquare className="h-12 w-12 text-primary mb-3" />
                              <p className="font-semibold text-primary">오.운.완 인증샷 추가</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                오늘 기록된 운동에 사진을 올려보세요!
                              </p>
                          </CardContent>
                      </Card>
                  ) : null }
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Target className="mr-3 h-7 w-7 text-accent" />
                오늘의 운동 목표
              </CardTitle>
              <CardDescription>목표를 설정하고 달성해봐요! (오늘 기록 기준)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow flex flex-col">
              {isLoadingExercises ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" /> :
              availableExercises.length === 0 ? (
                <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">선생님께서 아직 운동을 설정하지 않으셨어요.</p>
                </div>
              ) :
              hasEffectiveGoals ? (
                 <div className="flex items-center justify-center min-h-[10rem] bg-secondary/20 rounded-lg p-3 flex-grow">
                  <ul className="text-sm list-none space-y-1.5 pl-0 text-left w-full overflow-y-auto max-h-full">
                    {availableExercises.filter(ex => {
                      const goal = studentGoals[ex.id];
                      if (!goal) return false;
                      if ((ex.id === 'squat' || ex.id === 'jump_rope') && goal.count && goal.count > 0) return true;
                      if (ex.id === 'plank' && goal.time && goal.time > 0) return true;
                      if (ex.id === 'walk_run' && goal.distance && goal.distance > 0) return true;
                      return false;
                    }).map(exercise => {
                      const goal = studentGoals[exercise.id];
                      let goalText = "";
                       if (exercise.id === 'squat' || exercise.id === 'jump_rope') goalText = `${goal.count}${exercise.countUnit}`;
                       else if (exercise.id === 'plank') goalText = `${goal.time}${exercise.timeUnit}`;
                       else if (exercise.id === 'walk_run') goalText = `${goal.distance}${exercise.distanceUnit}`;

                      const progressText = getExerciseProgressText(exercise.id);
                      const IconComp = getIconByName(exercise.iconName);

                      return (
                        <li key={exercise.id} className="truncate py-1 border-b border-border/50 last:border-b-0" title={`${exercise.koreanName}: ${goalText}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-primary flex items-center">
                              <IconComp className="inline-block mr-2 h-4 w-4" />
                              {exercise.koreanName}
                            </span>
                            <span className="text-xs text-muted-foreground">{goalText}</span>
                          </div>
                          {progressText && <p className="text-xs text-accent mt-0.5">{progressText}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                 <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">나의 운동 목표를 설정해봐요!</p>
                </div>
              )}
              <Button variant="outline" className="w-full rounded-lg mt-auto py-3 text-base" onClick={() => setIsGoalsDialogOpen(true)} disabled={availableExercises.length === 0}>목표 설정/확인</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
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
                    <CardDescription>선택한 기간의 운동 기록을 확인하고, 목표 달성도도 살펴봐요.</CardDescription>
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
           {isLoadingExercises || isStudentActivityLogsLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" /> :
            availableExercises.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-2">운동 목록이 설정되지 않았습니다.</p> :
              (currentStudent &&
                <StudentActivityChart
                  logs={studentActivityLogs}
                  selectedStudent={currentStudent}
                  students={allStudents.filter(s => s.id === currentStudent.id)}
                  availableExercises={availableExercises}
                  timeFrame={activityChartTimeFrame}
                  studentGoals={studentGoals}
                />
              )
            }

            <h4 className="text-md font-semibold pt-6 border-t mt-8">최근 5개 활동:</h4>
            {isLoadingExercises || isStudentActivityLogsLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-2" /> :
            studentActivityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">기록된 활동이 없습니다.</p>
            ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 bg-secondary/20 rounded-lg text-sm">
                  {studentActivityLogs
                      .slice(0, 5)
                      .map(log => {
                          const exerciseInfo = availableExercises.find(ex => ex.id === log.exerciseId);
                          if (!exerciseInfo) return null;

                          let valueDisplay = "";
                          if (exerciseInfo.id === 'squat' || exerciseInfo.id === 'jump_rope') {
                            valueDisplay = `${log.countValue || 0}${exerciseInfo.countUnit || ''}`;
                          } else if (exerciseInfo.id === 'plank') {
                            valueDisplay = `${log.timeValue || 0}${exerciseInfo.timeUnit || ''}`;
                          } else if (exerciseInfo.id === 'walk_run') {
                            valueDisplay = `${log.distanceValue || 0}${exerciseInfo.distanceUnit || ''}`;
                          }
                          valueDisplay = valueDisplay.trim();
                          if (!valueDisplay || valueDisplay === "0" + (exerciseInfo.countUnit || exerciseInfo.timeUnit || exerciseInfo.distanceUnit || "")) valueDisplay = "기록됨";

                          return (
                              <div key={log.id} className="p-2 bg-background/50 rounded text-xs flex items-center justify-between">
                                  <span>{format(parseISO(log.date), "MM/dd (EEE)", { locale: ko })}: {exerciseInfo.koreanName} - {valueDisplay}</span>
                                  {log.imageUrl && (
                                    <a href={log.imageUrl} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0">
                                      <NextImage
                                        key={log.imageUrl} 
                                        src={log.imageUrl}
                                        alt="인증샷"
                                        width={32}
                                        height={32}
                                        className="rounded object-cover border"
                                        data-ai-hint="exercise activity"
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
            availableExercises={availableExercises}
          />
        )}

        <SetStudentGoalsDialog
          isOpen={isGoalsDialogOpen}
          onClose={() => setIsGoalsDialogOpen(false)}
          onSave={handleSaveGoals}
          exercises={availableExercises}
          currentStudent={currentStudent}
          initialGoals={studentGoals}
        />

        {currentStudent && (
          <UploadProofShotDialog
            isOpen={isUploadProofShotDialogOpen}
            onClose={() => setIsUploadProofShotDialogOpen(false)}
            student={currentStudent}
            logsWithoutImageToday={studentActivityLogs.filter(log => log.studentId === currentStudent.id && isToday(parseISO(log.date)) && !log.imageUrl)}
            availableExercises={availableExercises}
            onUploadComplete={handleProofShotUploadComplete}
          />
        )}

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
    
