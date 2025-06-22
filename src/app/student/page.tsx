
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Target, History, PlusCircle, LogOut, UserCheck, Loader2, AlertTriangle, KeyRound, Edit3, Camera, Info, Activity as ActivityIconLucide, CheckSquare, CalendarDays, Edit, CheckCircle, Trophy } from 'lucide-react';
import type { Student, ClassName, RecordedExercise, Gender, StudentGoal, CustomExercise as CustomExerciseType, Exercise as ExerciseType, LevelInfo } from '@/lib/types';
import { EXERCISES_SEED_DATA } from '@/data/mockData';
import SetStudentGoalsDialog from '@/components/SetStudentGoalsDialog';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ChangeOwnPinDialog from '@/components/ChangeOwnPinDialog';
import ChangeAvatarDialog from '@/components/ChangeAvatarDialog';
import JumpRopeCameraMode from '@/components/JumpRopeCameraMode';
import StudentActivityChart from '@/components/StudentActivityChart';
import LevelGuideDialog from '@/components/LevelGuideDialog';
import ClassRanking from '@/components/ClassRanking';
import { useToast } from "@/hooks/use-toast";
import { recommendStudentExercise, RecommendStudentExerciseOutput, RecommendStudentExerciseInput } from '@/ai/flows/recommend-student-exercise';
import { generatePersonalizedWelcomeMessage, GeneratePersonalizedWelcomeMessageInput, GeneratePersonalizedWelcomeMessageOutput } from '@/ai/flows/generatePersonalizedWelcomeMessage';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { format, parseISO, isToday, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';
import { Leaf, Droplets, Sprout, Star, Footprints, Zap, Medal, ShieldCheck, Crown, Gem } from 'lucide-react';
import Image from 'next/image';

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

const COMPLETION_COMPLIMENTS = [
  "목표 달성! 정말 대단해요! 🎉",
  "완벽해요! 오늘도 해냈군요. 최고! 👍",
  "성공! 이 기세를 몰아 다른 목표도 도전! 🔥",
  "해냈군요! 꾸준함이 정답이에요. 멋져요! ✨",
  "오늘 목표 클리어! 스스로에게 칭찬해주세요! 🏆"
];

const getCompletionCompliment = (exerciseName: string) => {
    const index = (new Date().getDate() + exerciseName.length) % COMPLETION_COMPLIMENTS.length;
    return COMPLETION_COMPLIMENTS[index];
};


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
    icon: getIconByName(customEx.iconName) || ActivityIconLucide,
  };
};

const getGradeFromClassName = (className?: ClassName): string => {
    if (!className) return "초등학생";
    const match = className.match(/(\d+)학년/);
    if (match && match[1]) {
      return `${match[1]}학년`;
    }
    const numMatch = className.match(/\d+/);
    if (numMatch && numMatch[0]) {
        const gradeNum = parseInt(numMatch[0], 10);
        if (gradeNum >=1 && gradeNum <=6) return `${gradeNum}학년`;
    }
    return "초등학생"; 
  };
  
const weeklyPlanDays = [
  { day: "일", dayEng: "Sun", defaultText: "가족과 함께 공원에서 신나게 뛰어놀아요!" },
  { day: "월", dayEng: "Mon", defaultText: "방과 후 친구들과 학교 운동장에서 즐거운 시간을 보내요!" },
  { day: "화", dayEng: "Tue", defaultText: "오늘은 푹 쉬면서 내일을 준비해요. 휴식도 중요!" },
  { day: "수", dayEng: "Wed", defaultText: "저녁에는 가족과 함께 집 근처에서 가벼운 운동을!" },
  { day: "목", dayEng: "Thu", defaultText: "체육 시간! 선생님과 함께 재미있는 활동을 해봐요." },
  { day: "금", dayEng: "Fri", defaultText: "오늘은 좋아하는 책을 읽거나 조용한 활동으로 쉬어요." },
  { day: "토", dayEng: "Sat", defaultText: "주말 아침, 공원에서 운동 기구를 이용해볼까요?" },
];


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
  const [isActivityLogsLoading, setIsActivityLogsLoading] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isLoadingClassData, setIsLoadingClassData] = useState(true);

  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isChangeOwnPinDialogOpen, setIsChangeOwnPinDialogOpen] = useState(false);
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);
  const [isLevelGuideDialogOpen, setIsLevelGuideDialogOpen] = useState(false);

  const [studentGoals, setStudentGoals] = useState<StudentGoal>({});
  const [studentActivityLogs, setStudentActivityLogs] = useState<RecordedExercise[]>([]);
  const [classActivityLogs, setClassActivityLogs] = useState<RecordedExercise[]>([]);
  const [recommendedExercise, setRecommendedExercise] = useState<RecommendStudentExerciseOutput | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [dailyCompliment, setDailyCompliment] = useState<string>('');
  
  const [teacherBaseWelcomeMessage, setTeacherBaseWelcomeMessage] = useState<string>(DEFAULT_STUDENT_WELCOME_MESSAGE);
  const [aiPersonalizedWelcome, setAiPersonalizedWelcome] = useState<string>('');
  const [isAiWelcomeLoading, setIsAiWelcomeLoading] = useState(true);

  const [availableExercises, setAvailableExercises] = useState<ExerciseType[]>([]);
  const [goalsMetTodayForXp, setGoalsMetTodayForXp] = useState<Set<string>>(new Set());

  const [isCameraModeOpen, setIsCameraModeOpen] = useState(false);
  const [cameraExerciseId, setCameraExerciseId] = useState<string | null>(null);
  
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());
  const [isRestDaySet, setIsRestDaySet] = useState(false);
  const todayDate = useMemo(() => new Date(), []);
  
  useEffect(() => {
    // This effect runs only when the component mounts or when the date changes.
    // It resets the daily "skipped" status for the student.
    setSkippedExercises(new Set());
    // Also reset daily goals from view, they will be re-fetched or user will be prompted to set them.
    setStudentGoals({}); 
    setIsRestDaySet(false);
  }, [todayDate]);


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
        } else if (allowedExercises.length === 4) {
            setAvailableExercises(allowedExercises);
        } else {
          setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
        }
      } else {
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

  const currentLevelInfo = useMemo(() => {
    return calculateLevelInfo(currentStudent?.totalXp);
  }, [currentStudent?.totalXp]);

  const fetchAiPersonalizedWelcome = useCallback(async (
    student: Student, 
    levelInfo: LevelInfo, 
    baseMessage: string
  ) => {
    setIsAiWelcomeLoading(true);
    try {
      const input: GeneratePersonalizedWelcomeMessageInput = {
        studentName: student.name,
        currentLevelName: levelInfo.name,
        totalXp: student.totalXp || 0,
        currentLevelMaxXp: levelInfo.maxXp, 
        baseTeacherMessagePart: baseMessage
      };
      const result: GeneratePersonalizedWelcomeMessageOutput = await generatePersonalizedWelcomeMessage(input);
      setAiPersonalizedWelcome(result.welcomeMessage);
    } catch (error) {
      console.error("AI 개인 맞춤 환영 메시지 생성 오류:", error);
      setAiPersonalizedWelcome(`${student.name}님, 안녕하세요! ${baseMessage}`); // Fallback
    } finally {
      setIsAiWelcomeLoading(false);
    }
  }, []);

  const fetchRecommendation = useCallback(async (student: Student | null, currentGoals: StudentGoal, currentLevelName: string) => {
    if (!student) return;
    setIsRecommendationLoading(true);
    try {
      const studentGrade = getGradeFromClassName(student.class);
      const input: RecommendStudentExerciseInput = {
        studentName: student.name,
        studentGrade: studentGrade,
        studentGender: student.gender,
        studentLevelName: currentLevelName,
        studentXp: student.totalXp || 0,
        exerciseGoals: currentGoals,
      };
      const recommendation = await recommendStudentExercise(input);
      setRecommendedExercise(recommendation);
    } catch (error) {
      console.error("AI 추천 가져오기 오류:", error);
      setRecommendedExercise(null);
    } finally {
      setIsRecommendationLoading(false);
    }
  }, []);

  const fetchStudentSpecificData = useCallback(async (studentId: string, studentName: string, studentRef: Student, currentExercises: ExerciseType[], currentLvlInfo: LevelInfo) => {
    if (!studentId) return Promise.resolve(undefined);

    setIsLoadingStudentData(true);
    setIsActivityLogsLoading(true);
    setIsAiWelcomeLoading(true);

    let unsubscribeLogs: (() => void) | undefined;

    try {
      const goalsDocRef = doc(db, "studentGoals", studentId);
      const goalsDocSnap = await getDoc(goalsDocRef);
      const fetchedGoals = goalsDocSnap.exists() ? (goalsDocSnap.data().goals || {}) : {};
      setStudentGoals(fetchedGoals);
      
      fetchRecommendation(studentRef, fetchedGoals, currentLvlInfo.name);

      const welcomeMsgDocRef = doc(db, STUDENT_WELCOME_MESSAGE_DOC_PATH);
      const welcomeMsgDocSnap = await getDoc(welcomeMsgDocRef);
      const baseWelcome = (welcomeMsgDocSnap.exists() && welcomeMsgDocSnap.data()?.text) 
                          ? welcomeMsgDocSnap.data()!.text 
                          : DEFAULT_STUDENT_WELCOME_MESSAGE;
      setTeacherBaseWelcomeMessage(baseWelcome);
      fetchAiPersonalizedWelcome(studentRef, currentLvlInfo, baseWelcome);


      const logsQuery = query(collection(db, "exerciseLogs"), where("studentId", "==", studentId));
      unsubscribeLogs = onSnapshot(logsQuery, (logsSnapshot) => {
        const logsList = logsSnapshot.docs.map(lDoc => {
          const data = lDoc.data();
          let dateStr = data.date;
          // Handle old Firestore Timestamps if they exist
          if (data.date && typeof data.date.toDate === 'function') {
            dateStr = data.date.toDate().toISOString();
          }
          return {
            id: lDoc.id,
            ...data,
            date: dateStr,
          } as RecordedExercise;
        });
        const sortedLogs = logsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStudentActivityLogs(sortedLogs);

        const todayLogs = sortedLogs.filter(log => isToday(parseISO(log.date)))

        const metToday = new Set<string>();
        currentExercises.forEach(exercise => {
          const goalData = fetchedGoals[exercise.id];
          if (!goalData) return;

          const logsForExerciseToday = todayLogs.filter(
            log => log.exerciseId === exercise.id
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
            achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
            currentGoalValue = goalData.steps;
          }

          if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
            metToday.add(exercise.id);
          }
        });
        setGoalsMetTodayForXp(metToday);
        setIsActivityLogsLoading(false);
      }, (error) => {
        console.error("Error fetching student logs in real-time:", error);
        toast({ title: "오류", description: "운동 기록 실시간 업데이트에 실패했습니다.", variant: "destructive" });
        setIsActivityLogsLoading(false);
      });

      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const complimentsDocSnap = await getDoc(complimentsDocRef);
      let adjectiveList = DEFAULT_POSITIVE_ADJECTIVES_KR;
      if (complimentsDocSnap.exists() && complimentsDocSnap.data()?.list && complimentsDocSnap.data()!.list.length > 0) {
        adjectiveList = complimentsDocSnap.data()!.list;
      }
      const dayOfMonth = new Date().getDate();
      const adjectiveIndex = (dayOfMonth - 1 + studentName.length) % adjectiveList.length;
      setDailyCompliment(adjectiveList[adjectiveIndex] || adjectiveList[0] || "");

      setIsLoadingStudentData(false);
    } catch (error) {
      console.error("Error fetching student specific data:", error);
      toast({ title: "오류", description: "학생 데이터를 불러오는 데 실패했습니다.", variant: "destructive" });
      setIsLoadingStudentData(false);
      setIsActivityLogsLoading(false);
      setIsAiWelcomeLoading(false);
    }
    return unsubscribeLogs;
  }, [toast, fetchRecommendation, fetchAiPersonalizedWelcome]);

  useEffect(() => {
    let unsubscribeLogsFunction: (() => void) | undefined;
    if (currentStudent && currentLevelInfo) {
        setIsActivityLogsLoading(true);

        if (availableExercises.length > 0 || !isLoadingExercises) {
            fetchStudentSpecificData(currentStudent.id, currentStudent.name, currentStudent, availableExercises, currentLevelInfo)
              .then(unsub => {
                if (unsub) unsubscribeLogsFunction = unsub;
              });
        } else {
            setIsLoadingStudentData(false);
            setIsActivityLogsLoading(false);
            setStudentActivityLogs([]);
        }
    } else {
      setStudentGoals({});
      setStudentActivityLogs([]);
      setRecommendedExercise(null);
      setAiPersonalizedWelcome('');
      setDailyCompliment('');
      setGoalsMetTodayForXp(new Set());
      setIsLoadingStudentData(false);
      setIsActivityLogsLoading(false);
      setIsAiWelcomeLoading(true);
    }
    return () => {
      if (unsubscribeLogsFunction) {
        unsubscribeLogsFunction();
      }
    };
  }, [currentStudent, fetchStudentSpecificData, availableExercises, isLoadingExercises, currentLevelInfo]);

  useEffect(() => {
    if (!currentStudent?.class) {
      setIsLoadingClassData(false);
      return;
    }

    setIsLoadingClassData(true);
    const logsQuery = query(collection(db, "exerciseLogs"), where("className", "==", currentStudent.class));

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            let dateStr = data.date;
            // Handle old Firestore Timestamps if they exist
            if (data.date && typeof data.date.toDate === 'function') {
                dateStr = data.date.toDate().toISOString();
            }
            return { id: doc.id, ...data, date: dateStr } as RecordedExercise
        });
        setClassActivityLogs(logs);
        setIsLoadingClassData(false);
    }, (error) => {
        console.error("Error fetching class activity logs:", error);
        toast({ title: "오류", description: "학급 활동 기록을 불러오는 데 실패했습니다.", variant: "destructive" });
        setIsLoadingClassData(false);
    });

    return () => unsubscribe();
}, [currentStudent?.class, toast]);


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

  const handleSaveGoals = async (data: { goals: StudentGoal; skipped: Set<string> }) => {
    const { goals: newGoals, skipped: newSkipped } = data;
    if (currentStudent && currentLevelInfo) {
      try {
        const goalsDocRef = doc(db, "studentGoals", currentStudent.id);
        await setDoc(goalsDocRef, { goals: newGoals, skipped: Array.from(newSkipped) }); // Store skipped as an array
        setStudentGoals(newGoals);
        setSkippedExercises(newSkipped);
        
        const allExercisesAreSkipped = availableExercises.length > 0 && availableExercises.every(ex => newSkipped.has(ex.id));
        setIsRestDaySet(allExercisesAreSkipped);
        
        toast({ title: "성공", description: allExercisesAreSkipped ? "휴식의 날로 설정되었습니다." : "운동 목표가 저장되었습니다." });
        setIsGoalsDialogOpen(false);

        const metToday = new Set<string>();
        availableExercises.forEach(exercise => {
          const goalData = newGoals[exercise.id];
          if (!goalData) return;
          const logsForExerciseToday = studentActivityLogs.filter(
            log => log.studentId === currentStudent.id && log.exerciseId === exercise.id && isToday(parseISO(log.date))
          );
          let achievedValue = 0;
          let currentGoalValue: number | undefined;
          if (exercise.id === 'squat' || exercise.id === 'jump_rope') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.countValue || 0), 0); currentGoalValue = goalData.count; }
          else if (exercise.id === 'plank') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.timeValue || 0), 0); currentGoalValue = goalData.time; }
          else if (exercise.id === 'walk_run') { achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.stepsValue || 0), 0); currentGoalValue = goalData.steps; }
          if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) { metToday.add(exercise.id); }
        });
        setGoalsMetTodayForXp(metToday);
        fetchRecommendation(currentStudent, newGoals, currentLevelInfo.name);
        fetchAiPersonalizedWelcome(currentStudent, currentLevelInfo, teacherBaseWelcomeMessage);


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
    setIsActivityLogsLoading(true);
  };

  const handleOpenLogForm = () => {
    if (currentStudent) {
        const exercisesWithGoals = Object.keys(studentGoals).filter(exId => {
            const goal = studentGoals[exId];
            if (!goal) return false;
            return (goal.count ?? 0) > 0 || (goal.time ?? 0) > 0 || (goal.steps ?? 0) > 0;
        });

        if (exercisesWithGoals.length === 0) {
            toast({ title: "알림", description: "먼저 오늘의 운동 목표를 설정해주세요.", variant: "default"});
            return;
        }

        const loggableExercises = availableExercises.filter(ex => 
            exercisesWithGoals.includes(ex.id) && !skippedExercises.has(ex.id)
        );

        if (loggableExercises.length === 0) {
            toast({ title: "알림", description: "오늘 기록할 수 있는 운동이 없습니다. (모든 목표 운동을 건너뛰었을 수 있습니다)", variant: "default"});
            return;
        }
        setIsLogFormOpen(true);
    }
  };

  const handleCloseLogForm = () => {
    setIsLogFormOpen(false);
  };

  const handleSaveExerciseLog = async (logData: Omit<RecordedExercise, 'id' | 'imageUrl'>) => {
    if (!currentStudent || !availableExercises || !currentLevelInfo) return;
    try {
      const docRef = await addDoc(collection(db, "exerciseLogs"), logData);

      toast({ title: "기록 완료!", description: "오늘의 운동이 성공적으로 기록되었어요! 참 잘했어요!" });
      setIsLogFormOpen(false);
      setIsCameraModeOpen(false);
      setCameraExerciseId(null);

      const exerciseId = logData.exerciseId;
      const exercise = availableExercises.find(ex => ex.id === exerciseId);

      if (exercise && !goalsMetTodayForXp.has(exerciseId)) {
        
        const logsQuery = query(collection(db, "exerciseLogs"),
          where("studentId", "==", currentStudent.id),
          where("exerciseId", "==", exerciseId)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logsForExerciseToday = logsSnapshot.docs
            .map(d => d.data() as RecordedExercise)
            .filter(l => isToday(parseISO(l.date)));
            
        const combinedLogs = [...logsForExerciseToday, { ...logData, id: docRef.id }];

        let achievedValue = 0;
        if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
        } else if (exercise.id === 'plank') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);
        } else if (exercise.id === 'walk_run') {
          achievedValue = combinedLogs.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
        }

        const goalData = studentGoals[exerciseId];
        let currentGoalValue: number | undefined;
        if (goalData) {
          if (exercise.id === 'squat' || exercise.id === 'jump_rope') currentGoalValue = goalData.count;
          else if (exercise.id === 'plank') currentGoalValue = goalData.time;
          else if (exercise.id === 'walk_run') currentGoalValue = goalData.steps;
        }

        if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
          const oldXp = currentStudent.totalXp || 0;
          const newTotalXp = oldXp + 10;
          const studentDocRef = doc(db, "students", currentStudent.id);
          await updateDoc(studentDocRef, { totalXp: newTotalXp });
          
          const updatedStudent = { ...currentStudent, totalXp: newTotalXp };
          setCurrentStudent(updatedStudent); // This will trigger re-calculation of currentLevelInfo via useMemo
          setGoalsMetTodayForXp(prev => new Set(prev).add(exerciseId));

          toast({ title: "✨ XP 획득! ✨", description: `${exercise.koreanName} 목표 달성! +10 XP` });
          
          const newLevelInfoAfterUpdate = calculateLevelInfo(newTotalXp);
          if (newLevelInfoAfterUpdate.level > currentLevelInfo.level) {
            toast({ title: "🎉 레벨 업! 🎉", description: `축하합니다! ${newLevelInfoAfterUpdate.name}(으)로 레벨 업!`, duration: 7000 });
            fetchAiPersonalizedWelcome(updatedStudent, newLevelInfoAfterUpdate, teacherBaseWelcomeMessage); // Re-fetch welcome on level up
          } else {
            fetchAiPersonalizedWelcome(updatedStudent, newLevelInfoAfterUpdate, teacherBaseWelcomeMessage); // Re-fetch welcome on XP change
          }
        }
      }
      fetchRecommendation(currentStudent, studentGoals, currentLevelInfo.name);


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
    if (currentStudent && cameraExerciseId) {
      const exerciseDetails = availableExercises.find(ex => ex.id === cameraExerciseId);
      if (exerciseDetails && exerciseDetails.id === 'jump_rope') {
        const logEntry: Omit<RecordedExercise, 'id' | 'imageUrl'> = {
          studentId: currentStudent.id,
          exerciseId: cameraExerciseId,
          date: new Date().toISOString(),
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

  const xpProgress = useMemo(() => {
    if (!currentStudent || !currentLevelInfo || currentLevelInfo.level === 10) return 100;
    const xpInCurrentLevel = (currentStudent.totalXp || 0) - currentLevelInfo.minXp;
    const xpForNextLevel = currentLevelInfo.maxXp - currentLevelInfo.minXp;
    return xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;
  }, [currentStudent, currentLevelInfo]);

  const hasEffectiveGoals = useMemo(() => {
    return Object.keys(studentGoals).filter(exId => {
      if (skippedExercises.has(exId)) return false;
      const goal = studentGoals[exId];
      if (!goal) return false;
      const ex = availableExercises.find(e => e.id === exId);
      if (!ex) return false;
      if ((ex.id === 'squat' || ex.id === 'jump_rope') && goal.count && goal.count > 0) return true;
      if (ex.id === 'plank' && goal.time && goal.time > 0) return true;
      if (ex.id === 'walk_run' && goal.steps && goal.steps > 0) return true;
      return false;
    }).length > 0;
  }, [studentGoals, availableExercises, skippedExercises]);

  const mainContentKey = `${currentStudent?.id || 'no-student'}-${isActivityLogsLoading}-${isAiWelcomeLoading}`;
  
  const currentDayOfWeek = useMemo(() => todayDate.getDay(), [todayDate]); // 0 for Sunday, ..., 6 for Saturday
  const startOfTheCurrentWeek = useMemo(() => startOfWeek(todayDate, { weekStartsOn: 0 }), [todayDate]);
  const todaysXp = useMemo(() => goalsMetTodayForXp.size * 10, [goalsMetTodayForXp]);


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

  if (isLoadingStudentData || (currentStudent && availableExercises.length === 0 && !isLoadingExercises) || isAiWelcomeLoading ) {
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
          <span className="ml-4 text-xl">
            {isLoadingStudentData ? `${currentStudent.name} 학생의 데이터를 불러오는 중...` : 
             isAiWelcomeLoading ? '환영 메시지 생성 중...' :
             '운동 목록 설정 대기 중...'}
          </span>
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

  const LevelIcon = currentLevelInfo?.icon || Gem;
  
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
        <div
          key={mainContentKey}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
            <Card className="shadow-lg rounded-xl flex flex-col lg:col-span-3">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary text-center lg:text-left">
                      나의 활동 공간
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                    <div>
                        <p className="text-base sm:text-lg text-muted-foreground mb-6 text-center lg:text-left whitespace-pre-wrap">
                            {isAiWelcomeLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : aiPersonalizedWelcome}
                        </p>
                    </div>

                    {currentLevelInfo && (
                      <div
                          className="mb-6 p-4 border rounded-lg shadow-inner bg-secondary/20 dark:bg-slate-800/30 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setIsLevelGuideDialogOpen(true)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsLevelGuideDialogOpen(true)}
                          aria-label="등급 안내 보기"
                      >
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
                                {currentLevelInfo.level < 10 && currentLevelInfo.maxXp !== Infinity && (
                                  <p className="text-xs text-muted-foreground">다음 레벨까지 {Math.max(0, currentLevelInfo.maxXp - (currentStudent.totalXp || 0))} XP</p>
                                )}
                            </div>
                        </div>
                        {currentLevelInfo.level < 10 && currentLevelInfo.maxXp !== Infinity && (
                          <Progress value={xpProgress} className="h-3 rounded-full" indicatorClassName={currentLevelInfo.colorClass.replace('text-', 'bg-')}/>
                        )}
                        {currentLevelInfo.level === 10 && (
                          <p className="text-center text-sm font-medium text-fuchsia-500 dark:text-fuchsia-400 mt-2">최고 레벨 달성! 🎉</p>
                        )}
                        <div className="text-center mt-2">
                          <Button variant="link" size="sm" className="text-xs h-auto p-0 text-primary/80 hover:text-primary">
                            <Info className="h-3 w-3 mr-1" /> 등급 안내 보기
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center mt-auto">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0" 
                          onClick={() => setIsGoalsDialogOpen(true)}
                          disabled={availableExercises.length === 0}
                        >
                            <CheckSquare className="mr-2 h-6 w-6" />
                            운동 목표 설정하기
                        </Button>
                        <Button size="lg" className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0" onClick={handleOpenLogForm}>
                            <PlusCircle className="mr-2 h-6 w-6" />
                            오늘의 운동 기록하기
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
            <CardContent className="space-y-4 flex-grow flex flex-col">
              {isLoadingExercises ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" /> :
              availableExercises.length === 0 ? (
                <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">선생님께서 아직 운동을 설정하지 않으셨어요.</p>
                </div>
              ) :
              hasEffectiveGoals ? (
                 <div className="space-y-3 flex-grow">
                    {availableExercises.filter(ex => {
                      if (skippedExercises.has(ex.id)) return false;
                      const goal = studentGoals[ex.id];
                      if (!goal) return false;
                      if ((ex.id === 'squat' || ex.id === 'jump_rope') && goal.count && goal.count > 0) return true;
                      if (ex.id === 'plank' && goal.time && goal.time > 0) return true;
                      if (ex.id === 'walk_run' && goal.steps && goal.steps > 0) return true;
                      return false;
                    }).map(exercise => {
                      const goal = studentGoals[exercise.id];
                      if (!goal) return null;

                      const IconComp = getIconByName(exercise.iconName) || ActivityIconLucide;
                      const logsForToday = studentActivityLogs.filter(log => log.studentId === currentStudent?.id && log.exerciseId === exercise.id && isToday(parseISO(log.date)));
                      
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
                        achievedValue = logsForToday.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
                        goalValue = goal.steps || 0;
                        unit = exercise.stepsUnit || "";
                      }
                      
                      const percent = goalValue > 0 ? Math.min(100, Math.round((achievedValue / goalValue) * 100)) : 0;
                      const isCompleted = percent >= 100;

                      return (
                        <div key={exercise.id} className="p-3 border rounded-lg bg-secondary/20">
                           <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-primary flex items-center">
                              <IconComp className="inline-block mr-2 h-5 w-5" />
                              {exercise.koreanName}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">{`목표 ${goalValue}${unit}`}</span>
                          </div>
                          <div className="text-right text-xs text-muted-foreground mb-1.5">
                            <span>{`지금까지 ${achievedValue}${unit}`}</span>
                            <span className="font-semibold text-accent ml-1">({percent}%)</span>
                          </div>
                          {isCompleted ? (
                              <div className="text-center py-2 bg-green-100 dark:bg-green-900/50 rounded-md border border-green-200 dark:border-green-800">
                                  <p className="font-semibold text-green-700 dark:text-green-300 text-sm flex items-center justify-center gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      {getCompletionCompliment(exercise.koreanName)}
                                  </p>
                              </div>
                          ) : (
                              <Progress value={percent} className="h-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
              ) : isRestDaySet ? (
                 <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">오늘은 쉬는 날! 내일 더 힘차게 운동해요. 💪</p>
                </div>
              ) : (
                 <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">오늘의 운동 목표를 설정해주세요!</p>
                </div>
              )}
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
                    {recommendedExercise.reasoning && <p className="text-xs text-muted-foreground mt-1 italic">({recommendedExercise.reasoning})</p>}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                     <AlertTriangle className="h-8 w-8 mb-2" />
                    <p>추천을 불러오지 못했어요.</p>
                    <Button variant="link" size="sm" onClick={() => currentStudent && currentLevelInfo && fetchRecommendation(currentStudent, studentGoals, currentLevelInfo.name)} className="mt-1">다시 시도</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center font-headline text-xl">
              <CalendarDays className="mr-3 h-7 w-7 text-green-600 dark:text-green-400" />
              나의 주간 운동 계획
            </CardTitle>
            <CardDescription>오늘의 목표를 설정하고, 주간 계획을 확인해보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {weeklyPlanDays.map((item, index) => {
                const currentDateForDay = addDays(startOfTheCurrentWeek, index);
                const formattedDate = format(currentDateForDay, "M.d", { locale: ko });
                const isCurrentDay = index === currentDayOfWeek;
                const isWeekend = index === 0 || index === 6;

                const todaysEffectiveGoals = availableExercises.filter(ex => {
                  if (skippedExercises.has(ex.id)) return false;
                  const goal = studentGoals[ex.id];
                  if (!goal) return false;
                  if ((ex.id === 'squat' || ex.id === 'jump_rope') && goal.count && goal.count > 0) return true;
                  if (ex.id === 'plank' && goal.time && goal.time > 0) return true;
                  if (ex.id === 'walk_run' && goal.steps && goal.steps > 0) return true;
                  return false;
                });

                return (
                  <Card 
                    key={index}
                    onClick={() => {
                        if (isCurrentDay) {
                            setIsGoalsDialogOpen(true);
                        } else {
                            toast({ title: "준비 중", description: "미래의 운동 계획 기능은 곧 추가될 예정입니다!" });
                        }
                    }}
                    onKeyDown={(e) => isCurrentDay && (e.key === 'Enter' || e.key === ' ') && setIsGoalsDialogOpen(true)}
                    tabIndex={0}
                    className={cn(
                      "flex flex-col text-center shadow-sm rounded-lg border transition-all cursor-pointer",
                      isCurrentDay 
                        ? "ring-4 ring-offset-1 ring-primary border-primary shadow-xl bg-primary/5 dark:bg-primary/10" 
                        : "bg-card hover:shadow-md",
                      isWeekend && !isCurrentDay ? "border-red-200 dark:border-red-800/70" : "border-border"
                    )}
                  >
                    <CardHeader className="p-2 pt-3">
                      <CardTitle className={cn(
                        "text-lg font-semibold", 
                        isWeekend && "text-red-600 dark:text-red-400"
                      )}>
                        {item.day}
                        <span className={cn("block text-xs font-normal", isCurrentDay ? "text-primary dark:text-primary-foreground/90" : "text-muted-foreground")}>{formattedDate}</span>
                      </CardTitle>
                      <CardDescription className="text-xs sr-only">{item.dayEng}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 flex-grow flex flex-col items-center justify-center">
                      <div className="text-xs flex-grow flex flex-col justify-center min-h-[5em] w-full">
                        {isCurrentDay ? (
                          hasEffectiveGoals ? (
                            <>
                              <ul className="text-left text-xs space-y-1 w-full px-1">
                                {todaysEffectiveGoals.map(exercise => {
                                  const goal = studentGoals[exercise.id];
                                  let goalText = "";
                                  if (exercise.id === 'squat' || exercise.id === 'jump_rope') goalText = `${goal.count}${exercise.countUnit}`;
                                  else if (exercise.id === 'plank') goalText = `${goal.time}${exercise.timeUnit}`;
                                  else if (exercise.id === 'walk_run') goalText = `${goal.steps}${exercise.stepsUnit}`;
                                  
                                  const IconComp = getIconByName(exercise.iconName) || ActivityIconLucide;
                                  return (
                                    <li key={exercise.id} className="flex items-center gap-1.5 truncate" title={`${exercise.koreanName}: ${goalText}`}>
                                      <IconComp className="h-3 w-3 shrink-0" />
                                      <span className="truncate font-medium">{exercise.koreanName}: {goalText}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                              {todaysXp > 0 && (
                                <p className="font-semibold text-green-600 dark:text-green-400 mt-2 text-center text-xs">
                                  +{todaysXp}XP 😊
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="font-semibold text-primary">{isRestDaySet ? '오늘은 쉬는 날' : '오늘의 목표를'}</p>
                                <p className="font-semibold text-primary">{isRestDaySet ? '푹 쉬어요!' : '설정해주세요'}</p>
                                <p className="text-xs text-muted-foreground mt-1">클릭하여 시작</p>
                            </div>
                          )
                        ) : (
                          <p className="min-h-[3em] leading-tight text-center">{item.defaultText}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
           {isActivityLogsLoading || isLoadingExercises ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" /> :
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
          </CardContent>
        </Card>

        {studentsInClass.length > 1 && (
            isLoadingClassData ? (
                <Card className="shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center font-headline text-xl">
                            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
                            우리반 명예의 전당
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-40 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">랭킹 불러오는 중...</span>
                    </CardContent>
                </Card>
            ) : (
                <ClassRanking 
                    students={studentsInClass}
                    logs={classActivityLogs}
                    currentStudentId={currentStudent.id}
                />
            )
        )}

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
            skippedExercises={skippedExercises}
            studentGoals={studentGoals}
          />
        )}

        <SetStudentGoalsDialog
          isOpen={isGoalsDialogOpen}
          onClose={() => setIsGoalsDialogOpen(false)}
          onSave={handleSaveGoals}
          exercises={availableExercises}
          currentStudent={currentStudent}
          initialGoals={studentGoals}
          skippedExercises={skippedExercises}
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

        {currentLevelInfo && <LevelGuideDialog
            isOpen={isLevelGuideDialogOpen}
            onClose={() => setIsLevelGuideDialogOpen(false)}
            levelTiers={LEVEL_TIERS}
        />}

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} {currentStudent?.name || '풍풍이'}의 운동기록장. 매일매일 건강하게!
      </footer>
    </div>
  );
}
