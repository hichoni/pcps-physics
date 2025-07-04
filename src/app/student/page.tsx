'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Target, History, PlusCircle, LogOut, UserCheck, Loader2, AlertTriangle, KeyRound, Edit3, Camera, Info, Activity as ActivityIconLucide, CheckSquare, CalendarDays, Edit, CheckCircle, Trophy, RotateCcw, Link as LinkIcon, Download, Megaphone, Mail } from 'lucide-react';
import type { Student, RecordedExercise, Gender, StudentGoal, CustomExercise as CustomExerciseType, Exercise as ExerciseType, LevelInfo, DailyGoalEntry, TeacherMessage, ManitoAssignment, MailboxMessage } from '@/lib/types';
import { EXERCISES_SEED_DATA } from '@/data/mockData';
import SetStudentGoalsDialog from '@/components/SetStudentGoalsDialog';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ChangeOwnPinDialog from '@/components/ChangeOwnPinDialog';
import ChangeAvatarDialog from '@/components/ChangeAvatarDialog';
import JumpRopeCameraMode from '@/components/JumpRopeCameraMode';
import StudentActivityChart from '@/components/StudentActivityChart';
import LevelGuideDialog from '@/components/LevelGuideDialog';
import ClassRanking from '@/components/ClassRanking';
import ClassmateWeeklyPlans from '@/components/ClassmateWeeklyPlans';
import MailboxDialog from '@/components/MailboxDialog'; // New Component
import { useToast } from "@/hooks/use-toast";
import { recommendStudentExercise, RecommendStudentExerciseOutput, RecommendStudentExerciseInput } from '@/ai/flows/recommend-student-exercise';
import { generatePersonalizedWelcomeMessage, GeneratePersonalizedWelcomeMessageInput, GeneratePersonalizedWelcomeMessageOutput } from '@/ai/flows/generatePersonalizedWelcomeMessage';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, runTransaction, increment, orderBy, writeBatch } from 'firebase/firestore';
import { format, parseISO, isToday, startOfWeek, addDays, endOfMonth } from 'date-fns';
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
const EXERCISES_BY_GRADE_DOC_PATH = "appConfig/exercisesByGrade";

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
  const [classStructure, setClassStructure] = useState<Record<string, Set<string>>>({});

  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClassNum, setSelectedClassNum] = useState<string>('');
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');
  const [studentForPinCheck, setStudentForPinCheck] = useState<Student | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const [isLoadingLoginOptions, setIsLoadingLoginOptions] = useState(true);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(true);
  const [isActivityLogsLoading, setIsActivityLogsLoading] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isLoadingClassData, setIsLoadingClassData] = useState(true);
  const [isLoadingClassmates, setIsLoadingClassmates] = useState(true);
  const [isLoadingNotice, setIsLoadingNotice] = useState(true);

  const [goalDialogState, setGoalDialogState] = useState<{isOpen: boolean; date: Date | null}>({ isOpen: false, date: null });
  const [logFormState, setLogFormState] = useState<{isOpen: boolean; initialExerciseId?: string}>({ isOpen: false });
  const [isChangeOwnPinDialogOpen, setIsChangeOwnPinDialogOpen] = useState(false);
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);
  const [isLevelGuideDialogOpen, setIsLevelGuideDialogOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false); // For Manito

  const [todaysGoals, setTodaysGoals] = useState<StudentGoal>({});
  const [todaysSkipped, setTodaysSkipped] = useState<Set<string>>(new Set());
  const [allDailyGoals, setAllDailyGoals] = useState<Record<string, { goals: StudentGoal; skipped: Set<string> }>>({});
  const [todaysActions, setTodaysActions] = useState<{ sentManitoMission?: boolean }>({});

  const [studentActivityLogs, setStudentActivityLogs] = useState<RecordedExercise[]>([]);
  const [classActivityLogs, setClassActivityLogs] = useState<RecordedExercise[]>([]);
  const [classmatesData, setClassmatesData] = useState<(Student & { dailyGoals: any; weeklyLikes: any; })[]>([]);
  const [recommendedExercise, setRecommendedExercise] = useState<RecommendStudentExerciseOutput | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [dailyCompliment, setDailyCompliment] = useState<string>('');
  
  const [teacherNotice, setTeacherNotice] = useState<TeacherMessage | null>(null);
  const [aiPersonalizedWelcome, setAiPersonalizedWelcome] = useState<string>('');
  const [isAiWelcomeLoading, setIsAiWelcomeLoading] = useState(true);

  const [availableExercises, setAvailableExercises] = useState<ExerciseType[]>([]);
  const [goalsMetTodayForXp, setGoalsMetTodayForXp] = useState<Set<string>>(new Set());

  const [isCameraModeOpen, setIsCameraModeOpen] = useState(false);
  const [cameraExerciseId, setCameraExerciseId] = useState<string | null>(null);
  
  // Manito state
  const [mySecretFriend, setMySecretFriend] = useState<Student | null>(null);
  const [mailboxMessages, setMailboxMessages] = useState<MailboxMessage[]>([]);
  
  const todayDate = useMemo(() => new Date(), []);
  
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [activityChartTimeFrame, setActivityChartTimeFrame] = useState<'today' | 'week' | 'month'>('today');
  const [isLiking, setIsLiking] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchLoginOptions = useCallback(async () => {
    setIsLoadingLoginOptions(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(sDoc => {
        const data = sDoc.data() as any; // Use any to handle old `class` field
        
        // Handle data migration from old format ("3학년 1반") to new format
        if (data.class && !data.grade) {
            const classString = data.class;
            const gradeMatch = classString.match(/(\d+)학년/);
            const classNumMatch = classString.match(/(\d+)반/);
            if (gradeMatch && classNumMatch) {
                data.grade = gradeMatch[1];
                data.classNum = classNumMatch[1];
            }
            delete data.class; // Remove old field
        }

        return { id: sDoc.id, ...data, totalXp: data.totalXp || 0 } as Student;
      });
      setAllStudents(studentsList);
      
      const structure: Record<string, Set<string>> = {};
      studentsList.forEach(s => {
          if (s.grade && s.classNum) { // Ensure grade and classNum exist before adding
            if (!structure[s.grade]) {
                structure[s.grade] = new Set();
            }
            structure[s.grade].add(s.classNum);
          }
      });
      setClassStructure(structure);

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
    // Try to log in from localStorage on initial load
    if (isLoadingLoginOptions) return; // Wait for students to be loaded
    const storedStudentId = localStorage.getItem('currentStudentId');
    if (storedStudentId && allStudents.length > 0 && !currentStudent) {
        const studentToLogin = allStudents.find(s => s.id === storedStudentId);
        if (studentToLogin) {
            setCurrentStudent(studentToLogin);
        } else {
            // Clear invalid ID
            localStorage.removeItem('currentStudentId');
        }
    }
  }, [allStudents, isLoadingLoginOptions, currentStudent]);

  useEffect(() => {
    if (!currentStudent) {
        setAvailableExercises([]);
        setIsLoadingExercises(false);
        return;
    }
    
    setIsLoadingExercises(true);
    const exercisesDocRef = doc(db, EXERCISES_BY_GRADE_DOC_PATH);
    const unsubscribe = onSnapshot(exercisesDocRef, (docSnap) => {
        const grade = currentStudent.grade;
        let exercisesForGrade: CustomExerciseType[] = [];

        if (docSnap.exists() && docSnap.data()?.[grade] && Array.isArray(docSnap.data()?.[grade])) {
            exercisesForGrade = docSnap.data()?.[grade] as CustomExerciseType[];
        }

        if (exercisesForGrade.length > 0) {
            setAvailableExercises(exercisesForGrade.map(convertCustomToInternalExercise));
        } else {
            // Fallback to seed data if Firestore is empty for this grade
            setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
        }
        setIsLoadingExercises(false);
    }, (error) => {
        console.error(`Error fetching exercises for grade ${currentStudent.grade}:`, error);
        toast({ title: "오류", description: "운동 목록 로딩에 실패했습니다. 기본 목록을 사용합니다.", variant: "destructive" });
        setAvailableExercises(EXERCISES_SEED_DATA.map(convertCustomToInternalExercise));
        setIsLoadingExercises(false);
    });

    return () => unsubscribe();
  }, [currentStudent, toast]);

  const currentLevelInfo = useMemo(() => {
    return calculateLevelInfo(currentStudent?.totalXp);
  }, [currentStudent?.totalXp]);

  const fetchAiPersonalizedWelcome = useCallback(async (
    student: Student, 
    levelInfo: LevelInfo
  ) => {
    setIsAiWelcomeLoading(true);
    
    // Cache key based on student ID and their current level.
    // A new message will be generated when they level up.
    const cacheKey = `personalized-welcome-${student.id}-${levelInfo.level}`;
    try {
      const cachedMessage = localStorage.getItem(cacheKey);

      if (cachedMessage) {
        setAiPersonalizedWelcome(cachedMessage);
        setIsAiWelcomeLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Could not read from localStorage for caching", e);
    }


    try {
      const input: GeneratePersonalizedWelcomeMessageInput = {
        studentName: student.name,
        currentLevelName: levelInfo.name,
        totalXp: student.totalXp || 0,
        currentLevelMaxXp: levelInfo.maxXp,
      };
      const result: GeneratePersonalizedWelcomeMessageOutput = await generatePersonalizedWelcomeMessage(input);
      
      if (result.welcomeMessage) {
        setAiPersonalizedWelcome(result.welcomeMessage);
        try {
          localStorage.setItem(cacheKey, result.welcomeMessage); // Save to cache
        } catch (e) {
          console.warn("Could not write to localStorage for caching", e);
        }
      } else {
        // Handle cases where AI returns an empty message
        setAiPersonalizedWelcome(`${student.name}님, 안녕하세요! 👋`);
      }
    } catch (error) {
      console.error("AI 개인 맞춤 환영 메시지 생성 오류:", error);
      setAiPersonalizedWelcome(`${student.name}님, 안녕하세요! 👋`); // Fallback message
    } finally {
      setIsAiWelcomeLoading(false);
    }
  }, []);

  const fetchRecommendation = useCallback(async (student: Student | null, currentGoals: StudentGoal, currentLevelName: string) => {
    if (!student) return;
    setIsRecommendationLoading(true);
    try {
      const studentGrade = `${student.grade}학년`;
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

  // Real-time listener for student's goals
  useEffect(() => {
    if (!currentStudent?.id) {
        setAllDailyGoals({});
        setTodaysActions({}); // Reset actions on logout
        return;
    }
    setIsLoadingStudentData(true);
    const goalsDocRef = doc(db, 'studentGoals', currentStudent.id);
    const unsubscribe = onSnapshot(goalsDocRef, (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : {}; // Get the whole doc data
        const dailyGoalsFromDb = data.dailyGoals || {};
        const dailyActionsFromDb = data.dailyActions || {}; // Get daily actions
        
        const processedGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }> = {};
        for (const dateKey in dailyGoalsFromDb) {
            processedGoals[dateKey] = {
            goals: dailyGoalsFromDb[dateKey].goals || {},
            skipped: new Set(dailyGoalsFromDb[dateKey].skipped || []),
            };
        }
        setAllDailyGoals(processedGoals);
        setTodaysActions(dailyActionsFromDb[todayKey] || {}); // Set today's actions
        setIsLoadingStudentData(false);
    }, (error) => {
        console.error("Error fetching goals snapshot: ", error);
        toast({ title: "오류", description: "목표 데이터를 실시간으로 가져오는 데 실패했습니다.", variant: "destructive" });
        setIsLoadingStudentData(false);
    });

    return () => unsubscribe();
  }, [currentStudent?.id, toast, todayKey]);

  // Set today's goals whenever all goals are updated
  useEffect(() => {
    const goalsForToday = allDailyGoals[todayKey] || { goals: {}, skipped: new Set() };
    setTodaysGoals(goalsForToday.goals);
    setTodaysSkipped(goalsForToday.skipped);
  }, [allDailyGoals, todayKey]);


  // Real-time listener for student's logs
  useEffect(() => {
    if (!currentStudent?.id) {
      setStudentActivityLogs([]);
      setGoalsMetTodayForXp(new Set());
      return;
    }

    setIsActivityLogsLoading(true);
    const logsQuery = query(collection(db, 'exerciseLogs'), where('studentId', '==', currentStudent.id));
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logsList = snapshot.docs.map(lDoc => {
            const data = lDoc.data();
            let dateStr = data.date;
            if (data.date && typeof data.date.toDate === 'function') {
                dateStr = data.date.toDate().toISOString();
            }
            return { id: lDoc.id, ...data, date: dateStr } as RecordedExercise;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setStudentActivityLogs(logsList);
        
        const todayLogs = logsList.filter(log => isToday(parseISO(log.date)));
        const goalsDataForToday = allDailyGoals[todayKey]?.goals || {};
        
        const metToday = new Set<string>();
        if (availableExercises.length > 0) {
            availableExercises.forEach(exercise => {
                const goalData = goalsDataForToday[exercise.id];
                if (!goalData) return;

                const logsForExerciseToday = todayLogs.filter(
                    log => log.exerciseId === exercise.id
                );

                let achievedValue = 0;
                let currentGoalValue: number | undefined;

                if (exercise.category === 'count_time') {
                    if (exercise.countUnit && goalData.count) {
                        achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.countValue || 0), 0);
                        currentGoalValue = goalData.count;
                    } else if (exercise.timeUnit && goalData.time) {
                        achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.timeValue || 0), 0);
                        currentGoalValue = goalData.time;
                    }
                } else if (exercise.category === 'steps_distance') {
                    if (exercise.stepsUnit && goalData.steps) {
                        achievedValue = logsForExerciseToday.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
                        currentGoalValue = goalData.steps;
                    }
                }
                
                if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
                    metToday.add(exercise.id);
                }
            });
        }
        setGoalsMetTodayForXp(metToday);
        setIsActivityLogsLoading(false);

    }, (error) => {
        console.error("Error fetching logs snapshot:", error);
        toast({ title: "오류", description: "운동 기록을 실시간으로 가져오는 데 실패했습니다.", variant: "destructive" });
        setIsActivityLogsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentStudent?.id, toast, availableExercises, allDailyGoals, todayKey]);


  // Effect for one-time fetches and AI calls when student changes
  useEffect(() => {
    if (!currentStudent || !currentLevelInfo) {
        setIsAiWelcomeLoading(true); // Reset loading state
        setDailyCompliment('');
        return;
    };

    const fetchWelcomeData = async () => {
        setIsAiWelcomeLoading(true);
        fetchAiPersonalizedWelcome(currentStudent, currentLevelInfo);

        const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
        const complimentsDocSnap = await getDoc(complimentsDocRef);
        let adjectiveList = DEFAULT_POSITIVE_ADJECTIVES_KR;
        if (complimentsDocSnap.exists() && complimentsDocSnap.data()?.list && complimentsDocSnap.data()!.list.length > 0) {
            adjectiveList = complimentsDocSnap.data()!.list;
        }
        const dayOfMonth = new Date().getDate();
        const adjectiveIndex = (dayOfMonth - 1 + currentStudent.name.length) % adjectiveList.length;
        setDailyCompliment(adjectiveList[adjectiveIndex] || adjectiveList[0] || "");
    };

    fetchWelcomeData();
  }, [currentStudent, currentLevelInfo, fetchAiPersonalizedWelcome]);


  // Real-time listener for teacher notices
  useEffect(() => {
      if (!currentStudent) {
          setTeacherNotice(null);
          setIsLoadingNotice(false); // Set to false if no student
          return;
      }
      setIsLoadingNotice(true); // Set to true when starting to fetch

      let classNoticeData: TeacherMessage | null = null;

      const classNoticeRef = doc(db, 'teacherMessages', `${currentStudent.grade}_${currentStudent.classNum}`);
      const gradeNoticeRef = doc(db, 'teacherMessages', `${currentStudent.grade}_all`);

      const unsubClass = onSnapshot(classNoticeRef, (docSnap) => {
          classNoticeData = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TeacherMessage : null;
          // If class-specific notice exists, it takes precedence immediately.
          if (classNoticeData) {
              setTeacherNotice(classNoticeData);
          }
      }, (error) => {
        console.error("Class notice listener error:", error);
      });

      const unsubGrade = onSnapshot(gradeNoticeRef, (docSnap) => {
          const gradeNoticeData = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TeacherMessage : null;
          // Set grade-wide notice ONLY if no class-specific notice exists.
          if (!classNoticeData) {
              setTeacherNotice(gradeNoticeData);
          }
          // Loading is considered done after we get the result for the grade-wide notice,
          // as it's the final fallback.
          setIsLoadingNotice(false);
      }, (error) => {
        console.error("Grade notice listener error:", error);
        setIsLoadingNotice(false);
      });

      return () => {
          unsubClass();
          unsubGrade();
      };
  }, [currentStudent]);


  // Effect for AI recommendation, runs when goals change
  useEffect(() => {
    if (currentStudent && currentLevelInfo && (Object.keys(todaysGoals).length > 0 || todaysSkipped.size > 0)) {
      fetchRecommendation(currentStudent, todaysGoals, currentLevelInfo.name);
    }
  }, [currentStudent, todaysGoals, todaysSkipped, currentLevelInfo, fetchRecommendation]);


  useEffect(() => {
    if (!currentStudent?.grade || !currentStudent?.classNum) {
      setIsLoadingClassData(false);
      return;
    }
    
    const currentClassName = `${currentStudent.grade}학년 ${currentStudent.classNum}반`;
    setIsLoadingClassData(true);
    const logsQuery = query(collection(db, "exerciseLogs"), where("className", "==", currentClassName));

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            let dateStr = data.date;
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
}, [currentStudent?.grade, currentStudent?.classNum, toast]);


  useEffect(() => {
    // This effect manages the list of students shown, either for login selection or for class features.
    if (currentStudent && allStudents.length > 0) {
      // If a student is logged in, populate studentsInClass with their classmates for ranking.
      setStudentsInClass(
        allStudents
          .filter(s => s.grade === currentStudent.grade && s.classNum === currentStudent.classNum)
          .sort((a, b) => a.studentNumber - b.studentNumber)
      );
    } else if (!currentStudent && selectedGrade && selectedClassNum && allStudents.length > 0) {
      // On the login screen, populate studentsInClass based on the selected grade and class.
      setStudentsInClass(
        allStudents
          .filter(student => student.grade === selectedGrade && student.classNum === selectedClassNum)
          .sort((a, b) => a.studentNumber - b.studentNumber)
      );
      // Reset student selection when class changes
      setSelectedStudentId('');
      setStudentForPinCheck(null);
      setEnteredPin('');
      setLoginError(null);
    } else {
      // If logged out and no class is selected, the list is empty.
      setStudentsInClass([]);
    }
  }, [currentStudent, selectedGrade, selectedClassNum, allStudents]);

  // Fetch classmates data
  useEffect(() => {
    if (!currentStudent) {
      setIsLoadingClassmates(false);
      return;
    };

    const fetchClassmatesData = async () => {
        setIsLoadingClassmates(true);
        try {
            const classmatesInSameClass = allStudents.filter(s => 
                s.grade === currentStudent.grade && 
                s.classNum === currentStudent.classNum
            );
            
            if (classmatesInSameClass.length <= 1) {
                setClassmatesData([]);
                setIsLoadingClassmates(false);
                return;
            }

            const dataPromises = classmatesInSameClass.map(async (classmate) => {
                const goalsDocRef = doc(db, 'studentGoals', classmate.id);
                const goalsDocSnap = await getDoc(goalsDocRef);
                const goalsData = goalsDocSnap.exists() ? goalsDocSnap.data() : { dailyGoals: {}, weeklyLikes: {} };
                
                const processedGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }> = {};
                if (goalsData.dailyGoals) {
                  for (const dateKey in goalsData.dailyGoals) {
                    processedGoals[dateKey] = {
                      goals: goalsData.dailyGoals[dateKey].goals || {},
                      skipped: new Set(goalsData.dailyGoals[dateKey].skipped || []),
                    };
                  }
                }

                return {
                    ...classmate,
                    dailyGoals: processedGoals,
                    weeklyLikes: goalsData.weeklyLikes || {}
                };
            });

            const combinedData = await Promise.all(dataPromises);
            setClassmatesData(combinedData);

        } catch (error) {
            console.error("Error fetching classmates data: ", error);
            toast({ title: "오류", description: "친구들의 계획을 불러오는 데 실패했어요.", variant: "destructive" });
        } finally {
            setIsLoadingClassmates(false);
        }
    };
    
    fetchClassmatesData();
  }, [currentStudent, allStudents, toast]);

    // Fetch Manito assignment
    useEffect(() => {
        if (!currentStudent || allStudents.length === 0) {
            setMySecretFriend(null);
            return;
        }
        const assignmentDocId = `${currentStudent.grade}_${currentStudent.classNum}`;
        const assignmentDocRef = doc(db, "manitoAssignments", assignmentDocId);

        const unsub = onSnapshot(assignmentDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const assignments = docSnap.data() as ManitoAssignment;
                const secretFriendId = assignments[currentStudent.id];
                if (secretFriendId) {
                    const friendData = allStudents.find(s => s.id === secretFriendId);
                    setMySecretFriend(friendData || null);
                } else {
                    setMySecretFriend(null);
                }
            } else {
                setMySecretFriend(null);
            }
        });

        return () => unsub();
    }, [currentStudent, allStudents]);

    // Listen to mailbox for new messages
    useEffect(() => {
        if (!currentStudent) {
            setMailboxMessages([]);
            return;
        }
        const mailboxCollectionRef = collection(db, 'students', currentStudent.id, 'mailbox');
        const q = query(mailboxCollectionRef, orderBy('createdAt', 'desc'));

        const unsub = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailboxMessage));
            setMailboxMessages(messages);
        });

        return () => unsub();
    }, [currentStudent]);

    const unreadMailCount = useMemo(() => mailboxMessages.filter(m => !m.isRead).length, [mailboxMessages]);

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
      localStorage.setItem('currentStudentId', studentForPinCheck.id);
      setCurrentStudent(studentForPinCheck);
      setLoginError(null);
      setStudentForPinCheck(null);
      setEnteredPin('');
    } else {
      setLoginError("PIN 번호가 올바르지 않습니다. 다시 시도해주세요.");
      setEnteredPin('');
    }
  };

  const handleSaveDailyGoal = async (data: { date: Date; goals: StudentGoal; skipped: Set<string> }) => {
    if (currentStudent) {
        const { date, goals, skipped } = data;
        const dateKey = format(date, 'yyyy-MM-dd');
        
        const dataToSave: DailyGoalEntry = {
            goals,
            skipped: Array.from(skipped),
        };

        try {
            const goalsDocRef = doc(db, "studentGoals", currentStudent.id);
            const docSnap = await getDoc(goalsDocRef);

            if (docSnap.exists()) {
                // Document exists, update the specific date field within the map
                await updateDoc(goalsDocRef, {
                    [`dailyGoals.${dateKey}`]: dataToSave,
                });
            } else {
                // Document doesn't exist, create it with the initial date's goal
                await setDoc(goalsDocRef, {
                    dailyGoals: {
                        [dateKey]: dataToSave,
                    },
                });
            }

            toast({ title: "성공", description: `${format(date, 'M월 d일')} 운동 목표가 저장되었습니다.` });
            setGoalDialogState({isOpen: false, date: null});
        } catch (error) {
            console.error("Error saving daily goals: ", error);
            toast({ title: "오류", description: "운동 목표 저장에 실패했습니다.", variant: "destructive" });
        }
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('currentStudentId');
    setCurrentStudent(null);
    setSelectedGrade('');
    setSelectedClassNum('');
    setSelectedStudentId('');
    setStudentForPinCheck(null);
    setEnteredPin('');
    setLoginError(null);
    setIsCameraModeOpen(false);
    setCameraExerciseId(null);
    setIsActivityLogsLoading(true);
  };

  const handleOpenLogForm = (initialExerciseId?: string) => {
    if (currentStudent) {
        // If clicking a specific goal card, we can always open the form.
        if (initialExerciseId) {
            setLogFormState({ isOpen: true, initialExerciseId });
            return;
        }

        const exercisesWithGoals = Object.keys(todaysGoals).filter(exId => {
            if (todaysSkipped.has(exId)) return false;
            const goal = todaysGoals[exId];
            if (!goal) return false;
            return (goal.count ?? 0) > 0 || (goal.time ?? 0) > 0 || (goal.steps ?? 0) > 0;
        });

        if (exercisesWithGoals.length === 0) {
            toast({ title: "알림", description: "먼저 오늘의 운동 목표를 설정해주세요.", variant: "default"});
            setGoalDialogState({ isOpen: true, date: new Date() });
            return;
        }
        setLogFormState({ isOpen: true, initialExerciseId: undefined });
    }
  };

  const handleCloseLogForm = () => {
    setLogFormState({ isOpen: false, initialExerciseId: undefined });
  };

  const handleSaveExerciseLog = async (logData: Omit<RecordedExercise, 'id' | 'imageUrl'>) => {
    if (!currentStudent || !availableExercises || !currentLevelInfo) return;
    try {
      const docRef = await addDoc(collection(db, "exerciseLogs"), logData);

      toast({ title: "기록 완료!", description: "오늘의 운동이 성공적으로 기록되었어요! 참 잘했어요!" });
      handleCloseLogForm();
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
        if (exercise.category === 'count_time') {
            if(exercise.countUnit) {
                achievedValue = combinedLogs.reduce((sum, log) => sum + (log.countValue || 0), 0);
            } else if (exercise.timeUnit) {
                achievedValue = combinedLogs.reduce((sum, log) => sum + (log.timeValue || 0), 0);
            }
        } else if (exercise.category === 'steps_distance') {
            achievedValue = combinedLogs.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
        }

        const goalData = todaysGoals[exerciseId];
        let currentGoalValue: number | undefined;
        if (goalData) {
          if (exercise.category === 'count_time') {
              if (exercise.countUnit) currentGoalValue = goalData.count;
              else if (exercise.timeUnit) currentGoalValue = goalData.time;
          } else if (exercise.category === 'steps_distance') {
              currentGoalValue = goalData.steps;
          }
        }

        if (currentGoalValue !== undefined && currentGoalValue > 0 && achievedValue >= currentGoalValue) {
          const oldXp = currentStudent.totalXp || 0;
          const newTotalXp = oldXp + 10;
          const studentDocRef = doc(db, "students", currentStudent.id);
          await updateDoc(studentDocRef, { totalXp: newTotalXp });
          
          const updatedStudent = { ...currentStudent, totalXp: newTotalXp };
          setCurrentStudent(updatedStudent);
          setGoalsMetTodayForXp(prev => new Set(prev).add(exerciseId));

          toast({ title: "✨ XP 획득! ✨", description: `${exercise.koreanName} 목표 달성! +10 XP` });
          
          const newLevelInfoAfterUpdate = calculateLevelInfo(newTotalXp);
          if (newLevelInfoAfterUpdate.level > currentLevelInfo.level) {
            toast({ title: "🎉 레벨 업! 🎉", description: `축하합니다! ${newLevelInfoAfterUpdate.name}(으)로 레벨 업!`, duration: 7000 });
            fetchAiPersonalizedWelcome(updatedStudent, newLevelInfoAfterUpdate);
          } else {
            fetchAiPersonalizedWelcome(updatedStudent, newLevelInfoAfterUpdate);
          }
        }
      }
      fetchRecommendation(currentStudent, todaysGoals, currentLevelInfo.name);


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
    setLogFormState({ isOpen: false });
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
          className: `${currentStudent.grade}학년 ${currentStudent.classNum}반`,
          countValue: count,
        };
        handleSaveExerciseLog(logEntry);
      } else {
        toast({title: "알림", description: "카메라 기록은 줄넘기 운동 전용입니다.", variant: "default"});
      }
    }
    handleCloseCameraMode();
  };

  const handleLikePlan = async (targetStudentId: string) => {
    if (isLiking || !currentStudent || targetStudentId === currentStudent.id) return;
  
    setIsLiking(targetStudentId);
  
    const weekKey = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const targetStudentGoalsRef = doc(db, "studentGoals", targetStudentId);
    const targetStudentRef = doc(db, "students", targetStudentId);
    const targetStudentData = classmatesData.find(s => s.id === targetStudentId);
  
    try {
      let isUnlikeAction = false;
  
      await runTransaction(db, async (transaction) => {
        const studentGoalsDoc = await transaction.get(targetStudentGoalsRef);
        const weeklyLikes = studentGoalsDoc.data()?.weeklyLikes?.[weekKey] || [];
        const isLikedInDb = weeklyLikes.includes(currentStudent!.id);
        isUnlikeAction = isLikedInDb;
  
        if (!studentGoalsDoc.exists()) {
          transaction.set(targetStudentGoalsRef, {
            weeklyLikes: { [weekKey]: [currentStudent!.id] }
          });
        } else {
          transaction.update(targetStudentGoalsRef, {
            [`weeklyLikes.${weekKey}`]: isLikedInDb ? arrayRemove(currentStudent!.id) : arrayUnion(currentStudent!.id)
          });
        }
  
        transaction.update(targetStudentRef, {
          totalXp: increment(isLikedInDb ? -5 : 5)
        });
      });
  
      setClassmatesData(prevData => {
        return prevData.map(student => {
          if (student.id === targetStudentId) {
            const updatedLikes = { ...(student.weeklyLikes || {}) };
            const weekLikes = updatedLikes[weekKey] || [];
            const isLikedInState = weekLikes.includes(currentStudent.id);
            const newTotalXp = (student.totalXp || 0) + (isLikedInState ? -5 : 5);
  
            if (isLikedInState) {
              updatedLikes[weekKey] = weekLikes.filter((id: string) => id !== currentStudent.id);
            } else {
              updatedLikes[weekKey] = [...weekLikes, currentStudent.id];
            }
            return { ...student, weeklyLikes: updatedLikes, totalXp: newTotalXp };
          }
          return student;
        });
      });
  
      toast({
        title: isUnlikeAction ? "좋아요 취소" : "좋아요!",
        description: isUnlikeAction
          ? "응원을 취소했어요."
          : `친구를 응원했어요! ${targetStudentData?.name} 학생이 5XP를 받았습니다. 👍`
      });
  
    } catch (error) {
      console.error("Error toggling plan like: ", error);
      toast({ title: "오류", description: "좋아요 처리에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsLiking(null);
    }
  };

  const handleOpenMailbox = () => {
    if (!currentStudent) return;
    setIsMailboxOpen(true);
    // Mark all unread messages as read
    const unreadMessages = mailboxMessages.filter(m => !m.isRead);
    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        const msgRef = doc(db, 'students', currentStudent.id, 'mailbox', msg.id);
        batch.update(msgRef, { isRead: true });
      });
      batch.commit().catch(err => console.error("Error marking messages as read:", err));
    }
  };

  const handleSendMessage = async (type: 'cheer' | 'mission', content: string) => {
    if (!currentStudent || !mySecretFriend) {
        toast({ title: "오류", description: "비밀친구가 지정되지 않아 메시지를 보낼 수 없습니다.", variant: "destructive" });
        return;
    }
    if (type === 'mission' && todaysActions.sentManitoMission) {
        toast({ title: "알림", description: "미션은 하루에 한 번만 보낼 수 있습니다.", variant: "default" });
        return;
    }
    try {
        const message: Omit<MailboxMessage, 'id'> = {
            fromId: currentStudent.id,
            toId: mySecretFriend.id,
            type,
            content,
            isRead: false,
            createdAt: new Date(),
            ...(type === 'mission' && { missionStatus: 'pending' })
        };
        
        const batch = writeBatch(db);
        const newMessageRef = doc(collection(db, 'students', mySecretFriend.id, 'mailbox'));
        batch.set(newMessageRef, message);

        if (type === 'mission') {
            const goalsDocRef = doc(db, 'studentGoals', currentStudent.id);
            batch.set(goalsDocRef, {
                dailyActions: {
                    [todayKey]: { sentManitoMission: true }
                }
            }, { merge: true });
        }
        
        await batch.commit();

        toast({ title: "성공!", description: "메시지를 비밀친구에게 보냈습니다." });
    } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "전송 실패", description: "메시지 전송 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleCompleteMission = async (messageId: string) => {
      if (!currentStudent) return;
      try {
          const messageRef = doc(db, 'students', currentStudent.id, 'mailbox', messageId);
          const studentRef = doc(db, 'students', currentStudent.id);

          await runTransaction(db, async (transaction) => {
              transaction.update(messageRef, { missionStatus: 'completed', isRead: true });
              transaction.update(studentRef, { totalXp: increment(10) });
          });
          toast({ title: "미션 완료!", description: "대단해요! 보너스 10 XP를 획득했습니다! ✨" });
      } catch (error) {
          console.error("Error completing mission:", error);
          toast({ title: "오류", description: "미션 완료 처리 중 오류가 발생했습니다.", variant: "destructive" });
      }
  };


  const xpProgress = useMemo(() => {
    if (!currentStudent || !currentLevelInfo || currentLevelInfo.level === 10) return 100;
    const xpInCurrentLevel = (currentStudent.totalXp || 0) - currentLevelInfo.minXp;
    const xpForNextLevel = currentLevelInfo.maxXp - currentLevelInfo.minXp;
    return xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;
  }, [currentStudent, currentLevelInfo]);

  const hasEffectiveGoalsToday = useMemo(() => {
    return availableExercises.some(exercise => {
      if (todaysSkipped.has(exercise.id)) return false;
      const goal = todaysGoals[exercise.id];
      if (!goal) return false;

      if (exercise.category === 'count_time') {
        if ((goal.count ?? 0) > 0 && exercise.countUnit) return true;
        if ((goal.time ?? 0) > 0 && exercise.timeUnit) return true;
      }
      if (exercise.category === 'steps_distance') {
        if ((goal.steps ?? 0) > 0 && exercise.stepsUnit) return true;
      }
      return false;
    });
  }, [todaysGoals, availableExercises, todaysSkipped]);


  const mainContentKey = `${currentStudent?.id || 'no-student'}-${isActivityLogsLoading}-${isAiWelcomeLoading}`;
  
  const currentDayOfWeek = useMemo(() => todayDate.getDay(), [todayDate]);
  const startOfTheCurrentWeek = useMemo(() => startOfWeek(todayDate, { weekStartsOn: 0 }), [todayDate]);
  const todaysXp = useMemo(() => goalsMetTodayForXp.size * 10, [goalsMetTodayForXp]);

  const renderWelcomeMessage = (message: string) => {
    if (!message) return null;

    const parts = message.split(/(<level>.*?<\/level>)/g);

    return parts.filter(Boolean).map((part, index) => {
        if (part.startsWith('<level>')) {
            const levelName = part.replace(/<\/?level>/g, '');
            return (
                <strong key={index} className={cn("font-bold", currentLevelInfo?.colorClass)}>
                    {levelName}
                </strong>
            );
        }
        return <span key={index}>{part}</span>;
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  
  const renderAttachment = (attachment: TeacherMessage['attachment']) => {
      if (!attachment) return null;
  
      switch (attachment.type) {
          case 'youtube':
              const embedUrl = getYouTubeEmbedUrl(attachment.url);
              if (embedUrl) {
                  return (
                      <div className="mt-4 aspect-video">
                          <iframe
                              width="100%"
                              height="100%"
                              src={embedUrl}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="rounded-lg"
                          ></iframe>
                      </div>
                  );
              }
              // Fallback to a regular link if URL is not a valid YouTube link
              return (
                  <Button asChild variant="link" className="mt-2">
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="mr-2 h-4 w-4" /> 영상 보기
                      </a>
                  </Button>
              );
          case 'url':
              return (
                  <Button asChild variant="outline" className="mt-4 w-full">
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="mr-2 h-4 w-4" /> 링크 열기
                      </a>
                  </Button>
              );
          case 'file':
              return (
                  <Button asChild variant="outline" className="mt-4 w-full">
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.fileName}>
                          <Download className="mr-2 h-4 w-4" /> {attachment.fileName || '파일 다운로드'}
                      </a>
                  </Button>
              );
          default:
              return null;
      }
  };

  const mySecretFriendData = useMemo(() => {
    if (!mySecretFriend) return null;
    return classmatesData.find(c => c.id === mySecretFriend.id);
  }, [mySecretFriend, classmatesData]);

  const secretFriendTodaysGoals = useMemo(() => {
    if (!mySecretFriendData) return {};
    return mySecretFriendData.dailyGoals?.[todayKey]?.goals || {};
  }, [mySecretFriendData, todayKey]);

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
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="grade-select">학년</Label>
                <Select value={selectedGrade} onValueChange={v => {setSelectedGrade(v); setSelectedClassNum(''); setSelectedStudentId('');}}>
                    <SelectTrigger id="grade-select" className="w-full"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                    <SelectContent>
                    {Object.keys(classStructure).sort().map(grade => (
                        <SelectItem key={grade} value={grade}>{grade}학년</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="class-select">반</Label>
                <Select value={selectedClassNum} onValueChange={v => {setSelectedClassNum(v); setSelectedStudentId('');}} disabled={!selectedGrade}>
                    <SelectTrigger id="class-select" className="w-full"><SelectValue placeholder="반 선택" /></SelectTrigger>
                    <SelectContent>
                    {selectedGrade && classStructure[selectedGrade] &&
                        Array.from(classStructure[selectedGrade]).filter(Boolean).sort().map(classNum => (
                        <SelectItem key={classNum} value={classNum}>{classNum}반</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-select">이름</Label>
              <Select
                value={selectedStudentId}
                onValueChange={handleStudentSelect}
                disabled={!selectedGrade || !selectedClassNum || studentsInClass.length === 0}
              >
                <SelectTrigger id="student-select" className="w-full">
                    <SelectValue placeholder={!selectedGrade || !selectedClassNum ? "학년과 반을 먼저 선택하세요" : (studentsInClass.length === 0 ? "이 학급에 학생 없음" : "학생 선택")} />
                </SelectTrigger>
                <SelectContent>
                  {studentsInClass.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.studentNumber}번 {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {studentForPinCheck && (
              <div className="space-y-2">
                <Label htmlFor="pin-input">PIN (4자리 숫자)</Label>
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

  if (isLoadingStudentData || isLoadingExercises) {
     return (
      <div className="flex flex-col min-h-screen">
        <StudentHeader
          studentName={currentStudent.name}
          gender={currentStudent.gender}
          avatarId={currentStudent.avatarSeed}
          onChangeAvatar={() => setIsChangeAvatarDialogOpen(true)}
          dailyCompliment={dailyCompliment}
          onOpenMailbox={handleOpenMailbox}
          unreadMailCount={unreadMailCount}
        />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-4 text-xl">
            {isLoadingStudentData ? `${currentStudent.name} 학생의 데이터를 불러오는 중...` : 
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
        onOpenMailbox={handleOpenMailbox}
        unreadMailCount={unreadMailCount}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div
          key={mainContentKey}
          className="space-y-6"
        >
            {isLoadingNotice ? (
                <Card className="shadow-lg rounded-xl flex items-center justify-center min-h-[10rem]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">선생님 공지 확인 중...</span>
                </Card>
            ) : teacherNotice ? (
                <Card className="shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary">
                            📣 선생님의 한마디
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <blockquote className="p-4 bg-secondary/20 dark:bg-slate-800/30 border-l-4 border-primary rounded-r-lg">
                            <p className="text-base sm:text-lg text-foreground/90 whitespace-pre-wrap">
                                {teacherNotice.message}
                            </p>
                        </blockquote>
                        {teacherNotice.attachment && (
                            <div className="mt-4">
                                {renderAttachment(teacherNotice.attachment)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : null}
            
            <Card className="shadow-lg rounded-xl flex flex-col">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary text-center lg:text-left">
                      나의 활동 공간
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="mb-6">
                        <div className="text-center lg:text-left">
                            <p className="text-base sm:text-lg text-muted-foreground whitespace-pre-wrap">
                                {isAiWelcomeLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto lg:mx-0" /> : renderWelcomeMessage(aiPersonalizedWelcome)}
                            </p>
                        </div>
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
                          onClick={() => setGoalDialogState({ isOpen: true, date: new Date() })}
                          disabled={availableExercises.length === 0}
                        >
                            <CheckSquare className="mr-2 h-6 w-6" />
                            운동 목표 설정하기
                        </Button>
                        <Button size="lg" className="rounded-lg py-3 px-6 text-lg flex-grow sm:flex-grow-0" onClick={() => handleOpenLogForm()}>
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
            <CardContent className="flex-grow flex flex-col">
              {isLoadingExercises ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-4" /> :
              availableExercises.length === 0 ? (
                <div className="flex items-center justify-center text-center py-4 flex-grow min-h-[10rem] rounded-lg">
                  <p className="text-muted-foreground">선생님께서 아직 운동을 설정하지 않으셨어요.</p>
                </div>
              ) :
              hasEffectiveGoalsToday ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                    {availableExercises.map(exercise => {
                      const goal = todaysGoals[exercise.id];
                      if (!goal || todaysSkipped.has(exercise.id)) return null;

                      // This container will hold all goals for a single exercise.
                      const goalItems = [];

                      if (exercise.category === 'count_time') {
                          if (goal.count && exercise.countUnit) goalItems.push({type: 'count', goal: goal.count, unit: exercise.countUnit});
                          if (goal.time && exercise.timeUnit) goalItems.push({type: 'time', goal: goal.time, unit: exercise.timeUnit});
                      } else if (exercise.category === 'steps_distance' && goal.steps && exercise.stepsUnit) {
                          goalItems.push({type: 'steps', goal: goal.steps, unit: exercise.stepsUnit});
                      }
                      
                      if (goalItems.length === 0) return null;

                      const logsForToday = studentActivityLogs.filter(log => log.studentId === currentStudent?.id && log.exerciseId === exercise.id && isToday(parseISO(log.date)));
                      const IconComp = getIconByName(exercise.iconName) || ActivityIconLucide;

                      return (
                        <button
                          key={exercise.id}
                          className="w-full text-left p-3 border rounded-lg bg-secondary/20 space-y-3 hover:bg-secondary/40 transition-colors"
                          onClick={() => handleOpenLogForm(exercise.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary flex items-center">
                              <IconComp className="inline-block mr-2 h-5 w-5" />
                              {exercise.koreanName}
                            </span>
                          </div>
                          {goalItems.map(item => {
                              let achievedValue = 0;
                              if (item.type === 'count') {
                                  achievedValue = logsForToday.reduce((sum, log) => sum + (log.countValue || 0), 0);
                              } else if (item.type === 'time') {
                                  achievedValue = logsForToday.reduce((sum, log) => sum + (log.timeValue || 0), 0);
                              } else if (item.type === 'steps') {
                                  achievedValue = logsForToday.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
                              }
                              
                              const percent = item.goal > 0 ? Math.min(100, Math.round((achievedValue / item.goal) * 100)) : 0;
                              const isCompleted = percent >= 100;

                              return (
                                <div key={`${exercise.id}-${item.type}`}>
                                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                    <span>목표 ({item.unit})</span>
                                    <span>{item.goal}{item.unit}</span>
                                  </div>
                                  <div className="text-right text-xs text-muted-foreground mt-1">
                                    <span>{`지금까지 ${achievedValue}${item.unit}`}</span>
                                    <span className="font-semibold text-accent ml-1">({percent}%)</span>
                                  </div>
                                  {isCompleted ? (
                                      <div className="text-center mt-1.5 py-1.5 bg-green-100 dark:bg-green-900/50 rounded-md border border-green-200 dark:border-green-800">
                                          <p className="font-semibold text-green-700 dark:text-green-300 text-xs flex items-center justify-center gap-1.5">
                                              <CheckCircle className="h-3.5 w-3.5" />
                                              {getCompletionCompliment(exercise.koreanName)}
                                          </p>
                                      </div>
                                  ) : (
                                      <Progress value={percent} className="h-2 mt-1.5" />
                                  )}
                                </div>
                              );
                          })}
                        </button>
                      );
                    })}
                  </div>
              ) : availableExercises.every(ex => todaysSkipped.has(ex.id)) ? (
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
                    <Button variant="link" size="sm" onClick={() => currentStudent && currentLevelInfo && fetchRecommendation(currentStudent, todaysGoals, currentLevelInfo.name)} className="mt-1">다시 시도</Button>
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
            <CardDescription>날짜를 클릭하여 해당 날의 운동 목표를 설정하거나 수정할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {weeklyPlanDays.map((item, index) => {
                const currentDateForDay = addDays(startOfTheCurrentWeek, index);
                const dateKey = format(currentDateForDay, 'yyyy-MM-dd');
                const formattedDate = format(currentDateForDay, "M.d", { locale: ko });
                const isCurrentDay = isToday(currentDateForDay);
                const isWeekend = index === 0 || index === 6;

                const dayGoalData = allDailyGoals[dateKey];
                const dayHasGoals = dayGoalData && Object.values(dayGoalData.goals).some(g => Object.values(g).some(v => (v ?? 0) > 0));
                const isRestDay = dayGoalData && availableExercises.every(ex => dayGoalData.skipped.has(ex.id)) && !dayHasGoals;

                const goalsForDay = dayHasGoals && dayGoalData.goals;

                return (
                  <Card 
                    key={index}
                    onClick={() => setGoalDialogState({ isOpen: true, date: currentDateForDay })}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setGoalDialogState({ isOpen: true, date: currentDateForDay })}
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
                        { goalsForDay ? (
                            <ul className="text-left text-xs space-y-1 w-full px-1">
                              {availableExercises
                                .filter(exercise => {
                                  const goal = goalsForDay[exercise.id];
                                  return goal && Object.values(goal).some(v => v && v > 0) && !dayGoalData.skipped.has(exercise.id);
                                })
                                .flatMap(exercise => {
                                  const goal = goalsForDay[exercise.id];
                                  if (!goal) return [];
                                  const IconComp = getIconByName(exercise.iconName) || ActivityIconLucide;
                                  const goalItems = [];
                                  if ((goal.count ?? 0) > 0 && exercise.countUnit) {
                                    goalItems.push({
                                      key: `${exercise.id}-count`, text: `${exercise.koreanName}: ${goal.count}${exercise.countUnit}`, Icon: IconComp
                                    });
                                  }
                                  if ((goal.time ?? 0) > 0 && exercise.timeUnit) {
                                    goalItems.push({
                                      key: `${exercise.id}-time`, text: `${exercise.koreanName}: ${goal.time}${exercise.timeUnit}`, Icon: IconComp
                                    });
                                  }
                                  if ((goal.steps ?? 0) > 0 && exercise.stepsUnit) {
                                    goalItems.push({
                                      key: `${exercise.id}-steps`, text: `${exercise.koreanName}: ${goal.steps}${exercise.stepsUnit}`, Icon: IconComp
                                    });
                                  }
                                  return goalItems;
                                })
                                .map(goalItem => (
                                  <li key={goalItem.key} className="flex items-center gap-1.5 truncate" title={goalItem.text}>
                                    <goalItem.Icon className="h-3 w-3 shrink-0" />
                                    <span className="truncate font-medium">{goalItem.text}</span>
                                  </li>
                                ))
                              }
                              {isCurrentDay && todaysXp > 0 && (
                                <li className="font-semibold text-green-600 dark:text-green-400 mt-2 text-center text-xs list-none">
                                  +{todaysXp}XP 😊
                                </li>
                              )}
                            </ul>
                        ) : isRestDay ? (
                           <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="font-semibold text-muted-foreground">휴식의 날</p>
                            </div>
                        ) : isCurrentDay ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="font-semibold text-primary">오늘의 목표를</p>
                                <p className="font-semibold text-primary">설정해주세요</p>
                                <p className="text-xs text-muted-foreground mt-1">클릭하여 시작</p>
                            </div>
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

        {isLoadingClassmates && (
          <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">친구들 계획 불러오는 중...</span>
          </div>
        )}
        {currentStudent && classmatesData.length > 0 && !isLoadingClassmates && (
            <ClassmateWeeklyPlans
                classmatesData={classmatesData}
                currentStudentId={currentStudent.id}
                availableExercises={availableExercises}
                onLikePlan={handleLikePlan}
                isLoading={isLoadingClassmates}
                likingStudentId={isLiking}
            />
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
            isOpen={logFormState.isOpen}
            onClose={handleCloseLogForm}
            onSave={handleSaveExerciseLog}
            recordedExercises={studentActivityLogs}
            onSwitchToCameraMode={handleSwitchToCameraMode}
            availableExercises={availableExercises}
            skippedExercises={todaysSkipped}
            studentGoals={todaysGoals}
            initialExerciseId={logFormState.initialExerciseId}
          />
        )}

        {goalDialogState.isOpen && goalDialogState.date && (
            <SetStudentGoalsDialog
              isOpen={goalDialogState.isOpen}
              onClose={() => setGoalDialogState({ isOpen: false, date: null })}
              onSave={handleSaveDailyGoal}
              date={goalDialogState.date}
              exercises={availableExercises}
              currentStudent={currentStudent}
              initialGoals={allDailyGoals[format(goalDialogState.date, 'yyyy-MM-dd')]?.goals || {}}
              skippedExercises={allDailyGoals[format(goalDialogState.date, 'yyyy-MM-dd')]?.skipped || new Set()}
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

        {currentLevelInfo && <LevelGuideDialog
            isOpen={isLevelGuideDialogOpen}
            onClose={() => setIsLevelGuideDialogOpen(false)}
            levelTiers={LEVEL_TIERS}
        />}

        {mySecretFriend && currentStudent && (
            <MailboxDialog
                isOpen={isMailboxOpen}
                onClose={() => setIsMailboxOpen(false)}
                messages={mailboxMessages}
                mySecretFriendName={mySecretFriend.name}
                onSendMessage={handleSendMessage}
                onCompleteMission={handleCompleteMission}
                currentStudentName={currentStudent.name}
                secretFriendTodaysGoals={secretFriendTodaysGoals}
                availableExercises={availableExercises}
                hasSentMissionToday={todaysActions.sentManitoMission === true}
            />
        )}

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} {currentStudent?.name || '풍풍이'}의 운동기록장. 매일매일 건강하게!
      </footer>
    </div>
  );
}
