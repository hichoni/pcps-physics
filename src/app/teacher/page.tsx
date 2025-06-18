
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import ExerciseSummaryChart from '@/components/ExerciseSummaryChart';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import AddStudentDialog from '@/components/AddStudentDialog';
import ManageStudentPinDialog from '@/components/ManageStudentPinDialog';
import ManageCustomExerciseDialog from '@/components/ManageCustomExerciseDialog'; // 새 컴포넌트
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Student, ClassName, RecordedExercise, CustomExercise as CustomExerciseType, Gender, TeacherExerciseRecommendation } from '@/lib/types'; // Exercise -> CustomExerciseType
import { EXERCISES_SEED_DATA } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, BarChart2, Lightbulb, ListChecks, UserPlus, Trash2, Sparkles, MessageSquarePlus, MessageSquareX, Loader2, Wand2, KeyRound, LogIn, Image as ImageIcon, Edit, Settings2, School, PlusCircle, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle as UICardTitle, CardDescription as UICardDescription, CardFooter } from '@/components/ui/card'; // CardTitle, CardDescription 이름 충돌 방지
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, addDoc, deleteDoc, doc, writeBatch, query, where, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot 
} from 'firebase/firestore';
import NextImage from 'next/image';
import { getIconByName } from '@/lib/iconMap'; // 아이콘 매핑 함수
import { v4 as uuidv4 } from 'uuid'; // UUID 생성

const formatExerciseValue = (exercise: CustomExerciseType | undefined, log: RecordedExercise): string => {
  if (!exercise) return "알 수 없는 운동";
  let parts = [];
  if (exercise.category === 'count_time') {
    if (log.countValue !== undefined && exercise.countUnit) parts.push(`${log.countValue}${exercise.countUnit}`);
    if (log.timeValue !== undefined && exercise.timeUnit) parts.push(`${log.timeValue}${exercise.timeUnit}`);
  } else if (exercise.category === 'steps_distance') {
    if (log.stepsValue !== undefined && exercise.stepsUnit) parts.push(`${log.stepsValue}${exercise.stepsUnit}`);
    if (log.distanceValue !== undefined && exercise.distanceUnit) parts.push(`${log.distanceValue}${exercise.distanceUnit}`);
  }
  return parts.length > 0 ? `${parts.join(', ')}` : "기록됨";
};

const DEFAULT_COMPLIMENTS_LIST = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];

const COMPLIMENTS_DOC_PATH = "appConfig/complimentsDoc";
const RECOMMENDATIONS_DOC_PATH = "appConfig/exerciseRecommendationsDoc";
const STUDENT_WELCOME_MESSAGE_DOC_PATH = "appConfig/studentWelcomeMessageDoc"; 
const DEFAULT_STUDENT_WELCOME_MSG = "오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?";
const CUSTOM_EXERCISES_DOC_PATH = "appConfig/customExercisesDoc";
const TEACHER_PIN = "0408";
const GRADES = ["1학년", "2학년", "3학년", "4학년", "5학년", "6학년", "기타"];


export default function TeacherPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(undefined);
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [dynamicClasses, setDynamicClasses] = useState<ClassName[]>([]);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>([]);
  const [compliments, setCompliments] = useState<string[]>(DEFAULT_COMPLIMENTS_LIST);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<TeacherExerciseRecommendation[]>([]);
  const [studentWelcomeMessage, setStudentWelcomeMessage] = useState<string>(DEFAULT_STUDENT_WELCOME_MSG);
  const [studentWelcomeMessageInput, setStudentWelcomeMessageInput] = useState<string>('');
  const [customExercises, setCustomExercises] = useState<CustomExerciseType[]>([]); 

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingCompliments, setIsLoadingCompliments] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingWelcomeMessage, setIsLoadingWelcomeMessage] = useState(true);
  const [isLoadingCustomExercises, setIsLoadingCustomExercises] = useState(true);

  const [isManageExerciseDialogOpen, setIsManageExerciseDialogOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<CustomExerciseType | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<CustomExerciseType | null>(null);
  const [isConfirmDeleteExerciseDialogOpen, setIsConfirmDeleteExerciseDialogOpen] = useState(false);

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === TEACHER_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN 번호가 올바르지 않습니다. 다시 시도해주세요.');
      setPinInput('');
    }
  };

  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Student));
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
          date: dateStr 
        } as RecordedExercise;
      });
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
      const unsub = onSnapshot(complimentsDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().list) {
          setCompliments(docSnap.data().list);
        } else {
          setCompliments(DEFAULT_COMPLIMENTS_LIST);
          if (!docSnap.exists()) {
              setDoc(complimentsDocRef, { list: DEFAULT_COMPLIMENTS_LIST });
          }
        }
      });
      return unsub;
    } catch (error) {
      console.error("Error fetching compliments: ", error);
      toast({ title: "오류", description: "칭찬 문구를 불러오는 데 실패했습니다.", variant: "destructive"});
      setCompliments(DEFAULT_COMPLIMENTS_LIST);
    } finally {
      setIsLoadingCompliments(false);
    }
  }, [toast]);

  const fetchExerciseRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      const unsub = onSnapshot(recommendationsDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().list) {
          setExerciseRecommendations(docSnap.data().list);
        } else {
          setExerciseRecommendations([]); 
          if (!docSnap.exists()) {
               setDoc(recommendationsDocRef, { list: [] });
          }
        }
      });
      return unsub;
    } catch (error) {
      console.error("Error fetching exercise recommendations: ", error);
      toast({ title: "오류", description: "추천 운동/팁 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
      setExerciseRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [toast]);

  const fetchStudentWelcomeMessage = useCallback(async () => {
    setIsLoadingWelcomeMessage(true);
    try {
      const welcomeMsgDocRef = doc(db, STUDENT_WELCOME_MESSAGE_DOC_PATH);
      const unsub = onSnapshot(welcomeMsgDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().text) {
          setStudentWelcomeMessage(docSnap.data().text);
          setStudentWelcomeMessageInput(docSnap.data().text);
        } else {
          setStudentWelcomeMessage(DEFAULT_STUDENT_WELCOME_MSG);
          setStudentWelcomeMessageInput(DEFAULT_STUDENT_WELCOME_MSG);
          setDoc(welcomeMsgDocRef, { text: DEFAULT_STUDENT_WELCOME_MSG });
        }
      });
      return unsub;
    } catch (error) {
      console.error("Error fetching student welcome message:", error);
      toast({ title: "오류", description: "학생 환영 메시지를 불러오는 데 실패했습니다.", variant: "destructive" });
      setStudentWelcomeMessage(DEFAULT_STUDENT_WELCOME_MSG);
      setStudentWelcomeMessageInput(DEFAULT_STUDENT_WELCOME_MSG);
    } finally {
      setIsLoadingWelcomeMessage(false);
    }
  }, [toast]);
  
  const fetchCustomExercises = useCallback(async () => {
    setIsLoadingCustomExercises(true);
    try {
      const exercisesDocRef = doc(db, CUSTOM_EXERCISES_DOC_PATH);
      const unsub = onSnapshot(exercisesDocRef, (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data()?.list)) {
          setCustomExercises(docSnap.data()?.list || []);
        } else {
          // Firestore에 데이터가 없으면 EXERCISES_SEED_DATA로 초기화
          setDoc(exercisesDocRef, { list: EXERCISES_SEED_DATA.map(ex => ({...ex})) });
          setCustomExercises(EXERCISES_SEED_DATA.map(ex => ({...ex})));
          toast({ title: "알림", description: "기본 운동 목록으로 초기화되었습니다."});
        }
      });
      return unsub;
    } catch (error) {
      console.error("Error fetching custom exercises: ", error);
      toast({ title: "오류", description: "운동 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
      setCustomExercises(EXERCISES_SEED_DATA.map(ex => ({...ex})));
    } finally {
      setIsLoadingCustomExercises(false);
    }
  }, [toast]);


  useEffect(() => {
    let unsubscribers: (() => void)[] = [];
    if (isAuthenticated) {
      fetchStudents();
      fetchLogs();
      fetchCompliments().then(unsub => unsub && unsubscribers.push(unsub));
      fetchExerciseRecommendations().then(unsub => unsub && unsubscribers.push(unsub));
      fetchStudentWelcomeMessage().then(unsub => unsub && unsubscribers.push(unsub));
      fetchCustomExercises().then(unsub => unsub && unsubscribers.push(unsub));
    }
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isAuthenticated, fetchStudents, fetchLogs, fetchCompliments, fetchExerciseRecommendations, fetchStudentWelcomeMessage, fetchCustomExercises]);

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
    try {
      const studentWithAvatarAndPin = {
        ...newStudentData,
        class: newStudentData.class.trim(),
        avatarSeed: '', 
      };
      const docRef = await addDoc(collection(db, "students"), studentWithAvatarAndPin);
      // No need to manually update state if using onSnapshot for students (but fetchStudents is not using onSnapshot)
      // So, we'll manually update for now or switch fetchStudents to onSnapshot
      const newStudent = { ...studentWithAvatarAndPin, id: docRef.id };
      setStudents(prevStudents => [...prevStudents, newStudent].sort((a,b) => a.class.localeCompare(b.class) || a.studentNumber - b.studentNumber));
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
        // State update will be handled by onSnapshot if fetchStudents is converted
        // For now, manual update:
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
      setNewCompliment('');
      toast({ title: "성공", description: "칭찬 문구가 추가되었습니다."});
    } catch (error) {
      console.error("Error adding compliment: ", error);
      toast({ title: "오류", description: "칭찬 문구 추가에 실패했습니다.", variant: "destructive"});
    }
  };

  const handleDeleteCompliment = async (complimentToDelete: string) => {
    try {
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      await updateDoc(complimentsDocRef, {
        list: arrayRemove(complimentToDelete)
      });
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
      setNewRecommendationTitle('');
      setNewRecommendationDetail('');
      toast({ title: "성공", description: "추천 운동/팁이 추가되었습니다."});
    } catch (error) {
        console.error("Error adding exercise recommendation: ", error);
        toast({ title: "오류", description: "추천 운동/팁 추가에 실패했습니다.", variant: "destructive"});
    }
  };

  const handleDeleteExerciseRecommendation = async (recommendationToDelete: TeacherExerciseRecommendation) => {
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      await updateDoc(recommendationsDocRef, {
        list: arrayRemove(recommendationToDelete)
      });
      toast({ title: "성공", description: "추천 운동/팁이 삭제되었습니다."});
    } catch (error) {
      console.error("Error deleting exercise recommendation: ", error);
      toast({ title: "오류", description: "추천 운동/팁 삭제에 실패했습니다.", variant: "destructive"});
    }
  };

  const handleSaveStudentWelcomeMessage = async () => {
    const messageToSave = studentWelcomeMessageInput.trim();
    if (messageToSave === '') {
      toast({ title: "오류", description: "환영 메시지를 입력해주세요.", variant: "destructive" });
      return;
    }
    try {
      const welcomeMsgDocRef = doc(db, STUDENT_WELCOME_MESSAGE_DOC_PATH);
      await setDoc(welcomeMsgDocRef, { text: messageToSave });
      toast({ title: "성공", description: "학생 환영 메시지가 저장되었습니다." });
    } catch (error) {
      console.error("Error saving student welcome message:", error);
      toast({ title: "오류", description: "학생 환영 메시지 저장에 실패했습니다.", variant: "destructive" });
    }
  };
  
  const handleSaveCustomExercise = async (exerciseData: CustomExerciseType) => {
    try {
      const exercisesDocRef = doc(db, CUSTOM_EXERCISES_DOC_PATH);
      const currentExercises = [...customExercises];
      
      if (exerciseToEdit) { // 수정 모드
        const index = currentExercises.findIndex(ex => ex.id === exerciseToEdit.id);
        if (index > -1) {
          currentExercises[index] = exerciseData;
        }
      } else { // 추가 모드
         if (customExercises.length >= 6) {
          toast({ title: "제한 초과", description: "운동은 최대 6개까지 추가할 수 있습니다.", variant: "destructive" });
          setIsManageExerciseDialogOpen(false);
          setExerciseToEdit(null);
          return;
        }
        currentExercises.push({ ...exerciseData, id: uuidv4() });
      }
      
      await setDoc(exercisesDocRef, { list: currentExercises });
      toast({ title: "성공", description: `운동이 ${exerciseToEdit ? '수정' : '추가'}되었습니다.` });
      setIsManageExerciseDialogOpen(false);
      setExerciseToEdit(null);
    } catch (error) {
      console.error("Error saving custom exercise: ", error);
      toast({ title: "오류", description: "운동 저장에 실패했습니다.", variant: "destructive"});
    }
  };

  const requestDeleteCustomExercise = (exercise: CustomExerciseType) => {
    setExerciseToDelete(exercise);
    setIsConfirmDeleteExerciseDialogOpen(true);
  };

  const confirmDeleteCustomExercise = async () => {
    if (exerciseToDelete) {
      try {
        const exercisesDocRef = doc(db, CUSTOM_EXERCISES_DOC_PATH);
        const updatedExercises = customExercises.filter(ex => ex.id !== exerciseToDelete.id);
        await setDoc(exercisesDocRef, { list: updatedExercises });
        toast({ title: "성공", description: `${exerciseToDelete.koreanName} 운동이 삭제되었습니다.` });
      } catch (error) {
        console.error("Error deleting custom exercise: ", error);
        toast({ title: "오류", description: "운동 삭제에 실패했습니다.", variant: "destructive"});
      }
    }
    setIsConfirmDeleteExerciseDialogOpen(false);
    setExerciseToDelete(null);
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
  
  const openAddExerciseDialog = () => {
    if (customExercises.length >= 6) {
      toast({ title: "제한 초과", description: "운동은 최대 6개까지 추가할 수 있습니다.", variant: "destructive" });
      return;
    }
    setExerciseToEdit(null);
    setIsManageExerciseDialogOpen(true);
  };

  const openEditExerciseDialog = (exercise: CustomExerciseType) => {
    setExerciseToEdit(exercise);
    setIsManageExerciseDialogOpen(true);
  };


  const memoizedExerciseSummaryChart = useMemo(() => (
    <ExerciseSummaryChart recordedExercises={recordedExercises} students={students} customExercises={customExercises} />
  ), [recordedExercises, students, customExercises]);

  const memoizedAiSuggestionBox = useMemo(() => <AiSuggestionBox recordedExercises={recordedExercises} />, [recordedExercises]);

  const isLoading = isLoadingStudents || isLoadingLogs || isLoadingCompliments || isLoadingRecommendations || isLoadingWelcomeMessage || isLoadingCustomExercises;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-xl rounded-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <KeyRound className="h-16 w-16 text-primary" />
            </div>
            <UICardTitle className="text-3xl font-bold font-headline text-primary">교사용 페이지</UICardTitle>
            <UICardDescription className="text-lg text-muted-foreground pt-1">
              계속하려면 학년 선택 후 PIN 번호를 입력하세요.
            </UICardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">학년 선택</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger id="grade-select" className="w-full text-base py-3 rounded-lg">
                    <SelectValue placeholder="담당 학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(grade => (
                      <SelectItem key={grade} value={grade} className="text-base py-2">{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                id="teacherPin"
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                placeholder="PIN 4자리 입력"
                maxLength={4}
                className="text-center text-2xl tracking-[0.3em] py-4 rounded-lg"
                autoFocus
                disabled={!selectedGrade}
              />
              {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
              <Button type="submit" size="lg" className="w-full py-4 text-xl rounded-lg" disabled={!selectedGrade || pinInput.length !== 4}>
                <LogIn className="mr-3 h-6 w-6" />
                확인
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 h-auto rounded-lg p-1.5">
            <TabsTrigger value="students" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Users className="mr-2 h-5 w-5" /> 학생 목록
            </TabsTrigger>
            <TabsTrigger value="log" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ListChecks className="mr-2 h-5 w-5" /> 활동 기록
            </TabsTrigger>
             <TabsTrigger value="gallery" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ImageIcon className="mr-2 h-5 w-5" /> 사진 갤러리
            </TabsTrigger>
            <TabsTrigger value="summary" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <BarChart2 className="mr-2 h-5 w-5" /> 요약
            </TabsTrigger>
            <TabsTrigger value="ai" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Lightbulb className="mr-2 h-5 w-5" /> AI 코치
            </TabsTrigger>
            <TabsTrigger value="exerciseManagement" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Settings2 className="mr-2 h-5 w-5" /> 운동 관리
            </TabsTrigger>
            <TabsTrigger value="welcomeMessage" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Edit3 className="mr-2 h-5 w-5" /> 환영 메시지
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
                      onManagePin={() => handleOpenManagePinDialog(student)}
                      recordedExercises={recordedExercises}
                      customExercises={customExercises} // Pass customExercises
                    />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
          
          <TabsContent value="log" className="mt-6">
             <section aria-labelledby="activity-log-heading">
                <h2 id="activity-log-heading" className="text-xl font-semibold mb-4 font-headline">
                  {selectedClass ? `${selectedClass} 학급` : '전체'} 최근 활동 (최대 20개)
                </h2>
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : recordedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto bg-card p-4 rounded-xl shadow-md">
                    {recordedExercises
                      .filter(log => !selectedClass || log.className === selectedClass)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0) )
                      .slice(0, 20) 
                      .map(log => {
                        const student = students.find(s => s.id === log.studentId);
                        const exerciseInfo = customExercises.find(ex => ex.id === log.exerciseId); 
                        const formattedValue = formatExerciseValue(exerciseInfo, log);
                        return (
                          <div key={log.id} className="p-3 bg-secondary/30 rounded-lg shadow-sm text-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p><strong>{student?.name || '알 수 없는 학생'}</strong> ({log.className} {student?.studentNumber}번)</p>
                                    <p>{exerciseInfo?.koreanName || log.exerciseId}: {formattedValue}</p>
                                    <p className="text-xs text-muted-foreground">
                                    날짜: {format(parseISO(log.date), "PPP", { locale: ko })}
                                    </p>
                                </div>
                                {log.imageUrl && (
                                    <a href={log.imageUrl} target="_blank" rel="noopener noreferrer" className="ml-4 shrink-0">
                                        <NextImage 
                                            src={log.imageUrl} 
                                            alt={`${student?.name || '학생'} 인증샷`} 
                                            width={64} 
                                            height={64} 
                                            className="rounded-md object-cover border"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent && !parent.querySelector('.image-error-placeholder-small')) {
                                                    const placeholder = document.createElement('div');
                                                    placeholder.className = 'image-error-placeholder-small w-16 h-16 flex items-center justify-center bg-muted text-muted-foreground text-xs';
                                                    placeholder.textContent = 'X';
                                                    parent.appendChild(placeholder);
                                                }
                                            }}
                                        />
                                    </a>
                                )}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {selectedClass ? `${selectedClass} 학급의` : '전체'} 활동 기록이 없습니다.
                  </p>
                )}
             </section>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <section aria-labelledby="photo-gallery-heading">
              <h2 id="photo-gallery-heading" className="text-xl font-semibold mb-4 font-headline">
                {selectedClass ? `${selectedClass} 학급 인증샷 갤러리` : '전체 인증샷 갤러리'}
              </h2>
              {isLoadingLogs ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">갤러리 로딩 중...</span>
                </div>
              ) : (
                (() => {
                  const photos = recordedExercises
                    .filter(log => log.imageUrl && (!selectedClass || log.className === selectedClass))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0));

                  if (photos.length === 0) {
                    return <p className="text-muted-foreground text-center py-4">업로드된 인증샷이 없습니다.</p>;
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map(log => {
                        const student = students.find(s => s.id === log.studentId);
                        const exerciseInfo = customExercises.find(ex => ex.id === log.exerciseId);
                        return (
                          <Card key={log.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <a href={log.imageUrl} target="_blank" rel="noopener noreferrer" className="block aspect-square relative bg-muted">
                              <NextImage
                                src={log.imageUrl!}
                                alt={`${student?.name || '학생'}의 ${exerciseInfo?.koreanName || '운동'} 인증샷`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 hover:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.image-error-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'image-error-placeholder absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs p-2 text-center';
                                    placeholder.textContent = '이미지를 불러올 수 없습니다.';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </a>
                            <CardContent className="p-3">
                              <p className="text-sm font-semibold truncate" title={student?.name || '알 수 없는 학생'}>
                                {student?.name || '알 수 없는 학생'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate" title={exerciseInfo?.koreanName || log.exerciseId}>
                                {exerciseInfo?.koreanName || log.exerciseId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(log.date), "yyyy년 MM월 dd일", { locale: ko })}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()
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
          
          <TabsContent value="exerciseManagement" className="mt-6">
            <section aria-labelledby="exercise-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 id="exercise-management-heading" className="text-xl font-semibold font-headline flex items-center">
                  <Settings2 className="mr-3 h-6 w-6 text-primary" />
                  학생 운동 목록 관리 (최대 6개)
                </h2>
                <Button onClick={openAddExerciseDialog} disabled={customExercises.length >= 6} className="rounded-lg">
                  <PlusCircle className="mr-2 h-5 w-5" /> 새 운동 추가
                </Button>
              </div>
              {isLoadingCustomExercises ? (
                 <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> 운동 목록 로딩 중...</div>
              ) : customExercises.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-muted-foreground mb-3">등록된 운동이 없습니다. 새 운동을 추가해주세요.</p>
                    <Button onClick={() => { // Firestore에 시드 데이터로 초기화
                        const exercisesDocRef = doc(db, CUSTOM_EXERCISES_DOC_PATH);
                        setDoc(exercisesDocRef, { list: EXERCISES_SEED_DATA.map(ex => ({...ex, id: uuidv4()})) })
                            .then(() => toast({title: "성공", description: "기본 운동 목록으로 초기화되었습니다."}))
                            .catch(() => toast({title: "오류", description: "초기화에 실패했습니다.", variant: "destructive"}));
                    }}>기본 운동 목록으로 초기화</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customExercises.map((ex) => {
                    const Icon = getIconByName(ex.iconName);
                    return (
                       <Card key={ex.id} className="shadow-sm">
                        <CardHeader className="flex flex-row justify-between items-start">
                          <div>
                            <UICardTitle className="text-lg flex items-center">
                              <Icon className="mr-2 h-5 w-5 text-primary" />
                              {ex.koreanName}
                            </UICardTitle>
                            <UICardDescription className="text-xs">{ex.category === 'count_time' ? '횟수/시간 기반' : '걸음/거리 기반'}</UICardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditExerciseDialog(ex)} aria-label="운동 수정 (개발중)">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => requestDeleteCustomExercise(ex)} aria-label="운동 삭제" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1 pl-6 pr-6 pb-4">
                          <p>아이콘 이름: {ex.iconName}</p>
                          {ex.countUnit && <p>{ex.countUnit}: 기본 {ex.defaultCount ?? 0}, 증가폭 {ex.countStep ?? 0}</p>}
                          {ex.timeUnit && <p>{ex.timeUnit}: 기본 {ex.defaultTime ?? 0}, 증가폭 {ex.timeStep ?? 0}</p>}
                          {ex.stepsUnit && <p>{ex.stepsUnit}: 기본 {ex.defaultSteps ?? 0}, 증가폭 {ex.stepsStep ?? 0}</p>}
                          {ex.distanceUnit && <p>{ex.distanceUnit}: 기본 {ex.defaultDistance ?? 0}, 증가폭 {ex.distanceStep ?? 0}</p>}
                          <p>AI 힌트: {ex.dataAiHint}</p>
                        </CardContent>
                       </Card>
                    );
                  })}
                   <p className="text-xs text-muted-foreground mt-4">
                    * 운동 수정 기능은 현재 개발 중입니다. 삭제 후 새로 추가해주세요.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="welcomeMessage" className="mt-6">
            <section aria-labelledby="welcome-message-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <h2 id="welcome-message-management-heading" className="text-xl font-semibold mb-6 font-headline flex items-center">
                <Edit3 className="mr-2 h-6 w-6 text-primary" />
                학생 환영 메시지 관리
              </h2>
              {isLoadingWelcomeMessage ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="studentWelcomeMessageInput" className="text-base">환영 메시지 내용</Label>
                    <Textarea
                      id="studentWelcomeMessageInput"
                      value={studentWelcomeMessageInput}
                      onChange={(e) => setStudentWelcomeMessageInput(e.target.value)}
                      placeholder="예: 오늘도 신나게 운동해볼까요?"
                      className="min-h-[100px] rounded-lg text-base mt-1"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      이 메시지는 학생 앱의 메인 화면 상단에 표시됩니다.
                    </p>
                  </div>
                  <Button onClick={handleSaveStudentWelcomeMessage} className="rounded-lg py-3">
                    <MessageSquarePlus className="mr-2 h-5 w-5" /> 메시지 저장
                  </Button>
                </div>
              )}
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

        <ManageCustomExerciseDialog
          isOpen={isManageExerciseDialogOpen}
          onClose={() => {
            setIsManageExerciseDialogOpen(false);
            setExerciseToEdit(null);
          }}
          onSave={handleSaveCustomExercise}
          exerciseToEdit={exerciseToEdit}
        />

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

        {exerciseToDelete && (
            <AlertDialog open={isConfirmDeleteExerciseDialogOpen} onOpenChange={setIsConfirmDeleteExerciseDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>운동 삭제 확인</AlertDialogTitle>
                    <AlertDialogDescription>
                    <strong>{exerciseToDelete.koreanName}</strong> 운동을 정말 삭제하시겠습니까? 이 운동과 관련된 학생들의 목표 설정 및 기록에는 영향을 주지 않지만, 더 이상 이 운동을 기록하거나 목표로 설정할 수 없게 됩니다.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsConfirmDeleteExerciseDialogOpen(false)}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteCustomExercise} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
