
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import AddStudentDialog from '@/components/AddStudentDialog';
import BatchAddStudentsDialog from '@/components/BatchAddStudentsDialog';
import ManageStudentPinDialog from '@/components/ManageStudentPinDialog';
import ManageCustomExerciseDialog from '@/components/ManageCustomExerciseDialog';
import ClassSummaryStats from '@/components/ClassSummaryStats'; 
import ClassWeeklyPlan from '@/components/ClassWeeklyPlan';
import StudentWeeklyPlanDialog from '@/components/StudentWeeklyPlanDialog'; // 새로 추가
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Student, RecordedExercise, CustomExercise as CustomExerciseType, Gender, TeacherExerciseRecommendation, StudentGoal, Exercise as ExerciseType, DailyGoalEntry, TeacherMessage, ManitoAssignment } from '@/lib/types';
import { EXERCISES_SEED_DATA } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, BarChart2, Lightbulb, ListChecks, UserPlus, Trash2, Sparkles, MessageSquarePlus, MessageSquareX, Loader2, Wand2, KeyRound, LogIn, Image as ImageIconLucide, Edit, Settings2, School, PlusCircle, Edit3, AlertCircle, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Activity as ActivityIcon, Construction, RotateCcw, FileUp, Link as LinkIcon, Download, Megaphone, FileVideo, Globe, Save, Shuffle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle as UICardTitle, CardDescription as UICardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO, isSameDay, subDays, addDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { db, storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import {
  collection, getDocs, addDoc, deleteDoc, doc, writeBatch, query, where, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { getIconByName } from '@/lib/iconMap';
import { cn } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_COMPLIMENTS_LIST = [
  "별처럼 빛나는", "항상 긍정적인", "꿈을 향해 달리는", "세상을 밝히는",
  "용감하고 씩씩한", "매일 성장하는", "사랑스러운", "창의적인", "지혜로운",
  "친절한", "도전하는", "행복을 전하는", "자신감 넘치는", "에너지 넘치는",
  "멋진", "희망찬", "빛나는", "슬기로운", "명랑한", "따뜻한 마음을 가진"
];

const COMPLIMENTS_DOC_PATH = "appConfig/complimentsDoc";
const RECOMMENDATIONS_DOC_PATH = "appConfig/exerciseRecommendationsDoc";
const EXERCISES_BY_GRADE_DOC_PATH = "appConfig/exercisesByGrade";
const TEACHER_PIN = "0408";
const GRADES = ["1", "2", "3", "4", "5", "6", "기타"];


export default function TeacherPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [dynamicClasses, setDynamicClasses] = useState<string[]>([]);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>([]);
  const [compliments, setCompliments] = useState<string[]>(DEFAULT_COMPLIMENTS_LIST);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<TeacherExerciseRecommendation[]>([]);
  const [allExercisesByGrade, setAllExercisesByGrade] = useState<Record<string, CustomExerciseType[]>>({});
  const [allStudentDailyGoals, setAllStudentDailyGoals] = useState<Record<string, Record<string, { goals: StudentGoal; skipped: Set<string>; }>>>({});

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingCompliments, setIsLoadingCompliments] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingCustomExercises, setIsLoadingCustomExercises] = useState(true);
  const [isLoadingStudentGoals, setIsLoadingStudentGoals] = useState(true);

  const [isManageExerciseDialogOpen, setIsManageExerciseDialogOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<CustomExerciseType | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<CustomExerciseType | null>(null);

  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<string>("students");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isBatchAddDialogOpen, setIsBatchAddDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [newCompliment, setNewCompliment] = useState<string>('');
  const [newRecommendationTitle, setNewRecommendationTitle] = useState<string>('');
  const [newRecommendationDetail, setNewRecommendationDetail] = useState<string>('');

  const [isManagePinDialogOpen, setIsManagePinDialogOpen] = useState(false);
  const [studentForPinManage, setStudentForPinManage] = useState<Student | null>(null);

  const [selectedLogDate, setSelectedLogDate] = useState<Date>(new Date());
  
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState<Student | null>(null);
  
  // State for new Notice Management
  const [noticeGrade, setNoticeGrade] = useState<string>('');
  const [classNumsForGrade, setClassNumsForGrade] = useState<string[]>([]);
  const [noticeClass, setNoticeClass] = useState<string>('all');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [attachmentType, setAttachmentType] = useState<'none' | 'url' | 'youtube' | 'file'>('none');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [currentNotice, setCurrentNotice] = useState<TeacherMessage | null>(null);
  const [isNoticeLoading, setIsNoticeLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // State for Manito feature
  const [manitoAssignments, setManitoAssignments] = useState<ManitoAssignment | null>(null);
  const [isAssigningManito, setIsAssigningManito] = useState(false);


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

  const fetchCompliments = useCallback(async () => {
    setIsLoadingCompliments(true);
    try {
      const complimentsDocRef = doc(db, COMPLIMENTS_DOC_PATH);
      const unsub = onSnapshot(complimentsDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.list) {
          setCompliments(docSnap.data()?.list);
        } else {
          setCompliments(DEFAULT_COMPLIMENTS_LIST);
          if (!docSnap.exists()) {
              setDoc(complimentsDocRef, { list: DEFAULT_COMPLIMENTS_LIST });
          }
        }
        setIsLoadingCompliments(false);
      }, (error) => {
          console.error("Error in compliments snapshot: ", error);
          toast({ title: "오류", description: "칭찬 문구 실시간 업데이트 중 오류 발생.", variant: "destructive"});
          setCompliments(DEFAULT_COMPLIMENTS_LIST);
          setIsLoadingCompliments(false);
      });
      return unsub;
    } catch (error) {
      console.error("Error setting up compliments snapshot: ", error);
      toast({ title: "오류", description: "칭찬 문구를 불러오는 데 실패했습니다.", variant: "destructive"});
      setCompliments(DEFAULT_COMPLIMENTS_LIST);
      setIsLoadingCompliments(false);
    }
  }, [toast]);

  const fetchExerciseRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      const unsub = onSnapshot(recommendationsDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.list) {
          setExerciseRecommendations(docSnap.data()?.list);
        } else {
          setExerciseRecommendations([]);
          if (!docSnap.exists()) {
               setDoc(recommendationsDocRef, { list: [] });
          }
        }
        setIsLoadingRecommendations(false);
      }, (error) => {
        console.error("Error in recommendations snapshot: ", error);
        toast({ title: "오류", description: "추천 운동/팁 실시간 업데이트 중 오류 발생.", variant: "destructive"});
        setExerciseRecommendations([]);
        setIsLoadingRecommendations(false);
      });
      return unsub;
    } catch (error) {
      console.error("Error setting up recommendations snapshot: ", error);
      toast({ title: "오류", description: "추천 운동/팁 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
      setExerciseRecommendations([]);
      setIsLoadingRecommendations(false);
    }
  }, [toast]);

  const fetchCustomExercises = useCallback(async () => {
    setIsLoadingCustomExercises(true);
    try {
      const exercisesDocRef = doc(db, EXERCISES_BY_GRADE_DOC_PATH);
      const unsub = onSnapshot(exercisesDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAllExercisesByGrade(docSnap.data() as Record<string, CustomExerciseType[]>);
        } else {
          setDoc(exercisesDocRef, {});
          setAllExercisesByGrade({});
        }
        setIsLoadingCustomExercises(false);
      }, (error) => {
         console.error("Error in custom exercises snapshot: ", error);
         toast({ title: "오류", description: "운동 목록 실시간 업데이트 중 오류 발생.", variant: "destructive"});
         setAllExercisesByGrade({});
         setIsLoadingCustomExercises(false);
      });
      return unsub;
    } catch (error) {
      console.error("Error setting up custom exercises snapshot: ", error);
      toast({ title: "오류", description: "운동 목록을 불러오는 데 실패했습니다.", variant: "destructive"});
      setAllExercisesByGrade({});
      setIsLoadingCustomExercises(false);
    }
  }, [toast]);

  const exercisesForCurrentGrade = useMemo(() => {
    if (!selectedGrade || isLoadingCustomExercises) return [];
    const gradeExercises = allExercisesByGrade[selectedGrade];
    if (!gradeExercises || gradeExercises.length === 0) {
      return EXERCISES_SEED_DATA;
    }
    return gradeExercises;
  }, [allExercisesByGrade, selectedGrade, isLoadingCustomExercises]);

  // Real-time listener for students
  useEffect(() => {
    if (!isAuthenticated) {
        setStudents([]);
        setDynamicClasses([]);
        return;
    }

    setIsLoadingStudents(true);
    const studentsCollectionRef = collection(db, "students");
    
    const unsubscribe = onSnapshot(studentsCollectionRef, (studentsSnapshot) => {
        const studentsList = studentsSnapshot.docs.map(sDoc => {
            const data = sDoc.data() as any;
            if (data.class && !data.grade) {
                const classString = data.class;
                const gradeMatch = classString.match(/(\d+)학년/);
                const classNumMatch = classString.match(/(\d+)반/);
                if (gradeMatch && classNumMatch) {
                    data.grade = gradeMatch[1];
                    data.classNum = classNumMatch[1];
                }
                delete data.class;
            }
            return { id: sDoc.id, ...data } as Student;
        });
        setStudents(studentsList);
        const classNames = Array.from(new Set(studentsList.filter(s => s.grade && s.classNum).map(s => `${s.grade}학년 ${s.classNum}반`))).sort();
        setDynamicClasses(classNames);
        setIsLoadingStudents(false);
    }, (error) => {
        console.error("Error fetching students snapshot: ", error);
        toast({ title: "오류", description: "학생 목록을 실시간으로 불러오는 데 실패했습니다.", variant: "destructive" });
        setIsLoadingStudents(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, toast]);

  // Real-time listener for exercise logs
  useEffect(() => {
    if (!isAuthenticated) {
        setRecordedExercises([]);
        return;
    }

    setIsLoadingLogs(true);
    const logsCollectionRef = collection(db, "exerciseLogs");

    const unsubscribe = onSnapshot(logsCollectionRef, (logsSnapshot) => {
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
        setIsLoadingLogs(false);
    }, (error) => {
        console.error("Error fetching logs snapshot: ", error);
        toast({ title: "오류", description: "운동 기록을 실시간으로 불러오는 데 실패했습니다.", variant: "destructive" });
        setIsLoadingLogs(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, toast]);
  
  // New useEffect to manage studentsInClass reactively
  useEffect(() => {
    if (isLoadingStudents) return;

    let filteredStudents: Student[];

    if (!selectedClass) {
      // "All students" view
      filteredStudents = [...students];
    } else {
      const gradeMatch = selectedClass.match(/(\d+)학년/);
      const classNumMatch = selectedClass.match(/(\d+)반/);
      const grade = gradeMatch ? gradeMatch[1] : '';
      const classNum = classNumMatch ? classNumMatch[1] : '';
      filteredStudents = students.filter(s => s.grade === grade && s.classNum === classNum);
    }

    // Sort the result
    filteredStudents.sort((a, b) => {
      if (!selectedClass) {
        const gradeCompare = (a.grade || '').localeCompare(b.grade || '');
        if (gradeCompare !== 0) return gradeCompare;
        const classNumCompare = (a.classNum || '').localeCompare(b.classNum || '');
        if (classNumCompare !== 0) return classNumCompare;
      }
      return Number(a.studentNumber) - Number(b.studentNumber);
    });

    setStudentsInClass(filteredStudents);
  }, [students, selectedClass, isLoadingStudents]);


  useEffect(() => {
    let unsubscribers: (() => void)[] = [];
    if (isAuthenticated) {
      fetchCompliments().then(unsub => unsub && unsubscribers.push(unsub));
      fetchExerciseRecommendations().then(unsub => unsub && unsubscribers.push(unsub));
      fetchCustomExercises().then(unsub => unsub && unsubscribers.push(unsub));
    }
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isAuthenticated, fetchCompliments, fetchExerciseRecommendations, fetchCustomExercises]);
  
  // Real-time listener for student goals in the selected class
  useEffect(() => {
    if (!isAuthenticated || !selectedClass) {
        setAllStudentDailyGoals({});
        setIsLoadingStudentGoals(false);
        return;
    }
    
    if (studentsInClass.length === 0) {
        setAllStudentDailyGoals({});
        setIsLoadingStudentGoals(false);
        return;
    }

    setIsLoadingStudentGoals(true);

    const unsubscribers = studentsInClass.map(student => {
        const goalsDocRef = doc(db, 'studentGoals', student.id);
        return onSnapshot(goalsDocRef, (docSnap) => {
            const dailyGoalsFromDb = docSnap.exists() ? docSnap.data().dailyGoals || {} : {};
            const processedGoals: Record<string, { goals: StudentGoal; skipped: Set<string> }> = {};
            
            for (const dateKey in dailyGoalsFromDb) {
                processedGoals[dateKey] = {
                    goals: dailyGoalsFromDb[dateKey].goals || {},
                    skipped: new Set(dailyGoalsFromDb[dateKey].skipped || []),
                };
            }
            
            setAllStudentDailyGoals(prev => ({
                ...prev,
                [student.id]: processedGoals
            }));
        }, (error) => {
            console.error(`Error listening to goals for student ${student.id}:`, error);
        });
    });

    const studentIds = studentsInClass.map(s => s.id);
    const goalPromises = studentIds.map(id => getDoc(doc(db, 'studentGoals', id)));
    Promise.all(goalPromises)
        .catch((err) => console.error("Error during initial goal fetch for loading state:", err))
        .finally(() => setIsLoadingStudentGoals(false));

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
  }, [isAuthenticated, selectedClass, studentsInClass]);
  
  // Effect for notice management form
  useEffect(() => {
      if (noticeGrade) {
          const nums = Array.from(new Set(students.filter(s => s.grade === noticeGrade).map(s => s.classNum)));
          setClassNumsForGrade(nums.sort((a, b) => Number(a) - Number(b)));
      } else {
          setClassNumsForGrade([]);
      }
      setNoticeClass('all'); // Reset class selection
  }, [noticeGrade, students]);
  
  // Fetch current notice when target changes
  useEffect(() => {
      if (!noticeGrade) {
          setCurrentNotice(null);
          setNoticeMessage('');
          setAttachmentType('none');
          setAttachmentUrl('');
          setAttachmentFile(null);
          return;
      }
  
      const fetchNotice = async () => {
          setIsNoticeLoading(true);
          const docId = `${noticeGrade}_${noticeClass}`;
          const noticeDocRef = doc(db, "teacherMessages", docId);
          try {
              const docSnap = await getDoc(noticeDocRef);
              if (docSnap.exists()) {
                  const data = docSnap.data() as Omit<TeacherMessage, 'id'>;
                  setCurrentNotice({ id: docSnap.id, ...data });
                  setNoticeMessage(data.message);
                  setAttachmentType(data.attachment?.type || 'none');
                  setAttachmentUrl(data.attachment?.type !== 'file' ? data.attachment?.url || '' : '');
              } else {
                  setCurrentNotice(null);
                  setNoticeMessage('');
                  setAttachmentType('none');
                  setAttachmentUrl('');
              }
          } catch (error) {
              console.error("Error fetching notice: ", error);
              toast({ title: "오류", description: "공지 정보를 불러오는 데 실패했습니다.", variant: "destructive" });
          } finally {
              setIsNoticeLoading(false);
              setAttachmentFile(null); // Clear file input on target change
          }
      };
  
      fetchNotice();
  }, [noticeGrade, noticeClass, toast]);

    // Fetch Manito assignments for the selected class
    useEffect(() => {
        if (!selectedClass) {
            setManitoAssignments(null);
            return;
        }
        const gradeMatch = selectedClass.match(/(\d+)학년/);
        const classNumMatch = selectedClass.match(/(\d+)반/);
        if (!gradeMatch || !classNumMatch) return;

        const assignmentDocId = `${gradeMatch[1]}_${classNumMatch[1]}`;
        const assignmentDocRef = doc(db, "manitoAssignments", assignmentDocId);

        const unsub = onSnapshot(assignmentDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setManitoAssignments(docSnap.data() as ManitoAssignment);
            } else {
                setManitoAssignments(null);
            }
        }, (error) => {
            console.error("Error fetching manito assignments:", error);
            setManitoAssignments(null);
        });

        return () => unsub();
    }, [selectedClass]);

  const goalsForSelectedDate = useMemo(() => {
    const dateKey = format(selectedLogDate, 'yyyy-MM-dd');
    const goals: Record<string, StudentGoal> = {};
    for (const student of studentsInClass) {
        goals[student.id] = allStudentDailyGoals[student.id]?.[dateKey]?.goals || {};
    }
    return goals;
  }, [allStudentDailyGoals, studentsInClass, selectedLogDate]);

  const handleClassChange = (className: string | 'all') => {
    if (className === 'all') {
      setSelectedClass(undefined);
      setSelectedGrade('');
    } else {
        const gradeMatch = className.match(/(\d+)학년/);
        const newGrade = gradeMatch ? gradeMatch[1] : '';
        setSelectedClass(className);
        setSelectedGrade(newGrade);
    }
  };

  const handleAddStudent = async (newStudentData: Omit<Student, 'id' | 'avatarSeed'>) => {
    try {
      const studentWithAvatar = { ...newStudentData, avatarSeed: '' };
      const docRef = await addDoc(collection(db, "students"), studentWithAvatar);
      const newStudent = { ...studentWithAvatar, id: docRef.id };
      
      const newClassName = `${newStudent.grade}학년 ${newStudent.classNum}반`;
      setStudents(prev => [...prev, newStudent].sort((a, b) => (`${a.grade}학년 ${a.classNum}반`).localeCompare(`${b.grade}학년 ${b.classNum}반`) || Number(a.studentNumber) - Number(b.studentNumber)));
      if (!dynamicClasses.includes(newClassName)) {
        setDynamicClasses(prev => [...prev, newClassName].sort());
      }
      
      const studentGoalsDocRef = doc(db, "studentGoals", newStudent.id);
      await setDoc(studentGoalsDocRef, { dailyGoals: {} });

      toast({ title: "성공", description: "학생이 추가되었습니다." });
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({ title: "오류", description: "학생 추가에 실패했습니다.", variant: "destructive"});
    }
  };
  
  const handleBatchAddStudents = async (studentsToAdd: Omit<Student, 'id' | 'avatarSeed'>[]) => {
    try {
      const batch = writeBatch(db);
      const studentsCollectionRef = collection(db, "students");
      const goalsCollectionRef = collection(db, "studentGoals");

      const newStudents: Student[] = [];
      const newClassNames = new Set(dynamicClasses);

      studentsToAdd.forEach(studentData => {
        const studentWithAvatar = { ...studentData, avatarSeed: '' };
        const newDocRef = doc(studentsCollectionRef); 
        batch.set(newDocRef, studentWithAvatar);
        
        const newStudent = { ...studentWithAvatar, id: newDocRef.id };
        newStudents.push(newStudent);
        
        const goalsDocRef = doc(goalsCollectionRef, newDocRef.id);
        batch.set(goalsDocRef, { dailyGoals: {} });
        
        newClassNames.add(`${newStudent.grade}학년 ${newStudent.classNum}반`);
      });
      
      await batch.commit();

      setStudents(prev => [...prev, ...newStudents].sort((a,b) => (`${a.grade}학년 ${a.classNum}반`).localeCompare(`${b.grade}학년 ${b.classNum}반`) || Number(a.studentNumber) - Number(b.studentNumber)));
      setDynamicClasses(Array.from(newClassNames).sort());

    } catch (error) {
      console.error("Error batch adding students: ", error);
      toast({ title: "오류", description: "학생 일괄 추가에 실패했습니다.", variant: "destructive"});
      throw error; 
    }
  };


  const requestDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
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
        
        const remainingStudents = students.filter(s => s.id !== studentToDelete.id);
        setStudents(remainingStudents);
        setRecordedExercises(prevLogs => prevLogs.filter(log => log.studentId !== studentToDelete.id));
        setAllStudentDailyGoals(prevGoals => {
            const newGoals = {...prevGoals};
            delete newGoals[studentToDelete.id];
            return newGoals;
        });

        const updatedClassNames = Array.from(new Set(remainingStudents.map(s => `${s.grade}학년 ${s.classNum}반`))).sort();
        setDynamicClasses(updatedClassNames);
        if(selectedClass && !updatedClassNames.includes(selectedClass)){
          setSelectedClass(undefined);
        }

        toast({ title: "성공", description: `${studentToDelete.name} 학생 정보가 삭제되었습니다.` });
      } catch (error) {
        console.error("Error deleting student: ", error);
        toast({ title: "오류", description: "학생 정보 삭제에 실패했습니다.", variant: "destructive"});
      }
    }
    setStudentToDelete(null);
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
  
  const handleSaveNotice = async () => {
    if (!noticeGrade) {
        toast({ title: "학년 미선택", description: "공지를 등록할 학년을 선택해주세요.", variant: "destructive" });
        return;
    }
    if (!noticeMessage.trim()) {
        toast({ title: "내용 없음", description: "공지 내용을 입력해주세요.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const docId = `${noticeGrade}_${noticeClass}`;
    const noticeDocRef = doc(db, "teacherMessages", docId);
    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;

    try {
        // 1. If there's a new file, upload it
        if (attachmentType === 'file' && attachmentFile) {
            const filePath = `notices/${noticeGrade}/${noticeClass}/${Date.now()}_${attachmentFile.name}`;
            const fileStorageRef = storageRef(storage, filePath);
            const uploadTask = await uploadBytesResumable(fileStorageRef, attachmentFile);
            fileUrl = await getDownloadURL(uploadTask.ref);
            fileName = attachmentFile.name;
            fileSize = attachmentFile.size;
        }

        // 2. Prepare data for Firestore
        const noticeData: Partial<TeacherMessage> = {
            grade: noticeGrade,
            classNum: noticeClass,
            message: noticeMessage,
            createdAt: new Date(),
        };

        if (attachmentType !== 'none') {
            noticeData.attachment = {
                type: attachmentType,
                url: attachmentType === 'file' ? fileUrl : attachmentUrl,
                ...(attachmentType === 'file' && { fileName, fileSize }),
            };
        } else {
            noticeData.attachment = undefined;
        }

        // 3. If there was an old file and we are replacing it or removing it, delete the old file
        if (currentNotice?.attachment?.type === 'file' && (attachmentType !== 'file' || attachmentFile)) {
            const oldFileRef = storageRef(storage, currentNotice.attachment.url);
            await deleteObject(oldFileRef).catch(err => console.warn("Old file deletion failed, it might not exist:", err));
        }
        
        // 4. Save to Firestore
        await setDoc(noticeDocRef, noticeData);
        
        toast({ title: "성공", description: "공지가 성공적으로 저장되었습니다." });
        setAttachmentFile(null); // Clear file after successful upload

    } catch (error) {
        console.error("Error saving notice: ", error);
        toast({ title: "저장 실패", description: "공지 저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
};

const handleClearNotice = async () => {
    if (!currentNotice) return;

    setIsUploading(true);
    try {
        // Delete file from storage if it exists
        if (currentNotice.attachment?.type === 'file') {
            const fileRef = storageRef(storage, currentNotice.attachment.url);
            await deleteObject(fileRef);
        }
        // Delete document from Firestore
        const noticeDocRef = doc(db, "teacherMessages", currentNotice.id);
        await deleteDoc(noticeDocRef);
        
        toast({ title: "삭제 완료", description: "공지가 삭제되었습니다." });
        setCurrentNotice(null);
        setNoticeMessage('');
        setAttachmentType('none');
        setAttachmentUrl('');
    } catch (error) {
        console.error("Error clearing notice: ", error);
        toast({ title: "삭제 실패", description: "공지 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
};

  const handleSaveCustomExercise = async (exerciseData: CustomExerciseType | Omit<CustomExerciseType, 'id'>) => {
    if (!selectedGrade) {
        toast({ title: "오류", description: "운동을 저장할 학년을 선택해주세요.", variant: "destructive"});
        return;
    }
    
    const dataWithId = 'id' in exerciseData ? exerciseData : { ...exerciseData, id: uuidv4() };
    const baseExercises = allExercisesByGrade[selectedGrade] || [];
    const isEditing = 'id' in exerciseData && baseExercises.some(ex => ex.id === exerciseData.id);

    const dataToSave: Partial<CustomExercise> = { ...dataWithId };
    
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key as keyof typeof dataToSave] === undefined) {
        delete dataToSave[key as keyof typeof dataToSave];
      }
    });

    try {
        const exercisesDocRef = doc(db, EXERCISES_BY_GRADE_DOC_PATH);
        
        let updatedExercises: CustomExerciseType[];

        if (isEditing) {
            updatedExercises = baseExercises.map(ex => ex.id === dataWithId.id ? { ...ex, ...dataToSave } as CustomExerciseType : ex);
            toast({ title: "성공", description: `운동 "${dataWithId.koreanName}"이(가) 수정되었습니다.` });
        } else {
             if (baseExercises.length >= 6) {
                toast({ title: "제한 초과", description: "운동은 최대 6개까지만 추가할 수 있습니다.", variant: "destructive" });
                return;
            }
            updatedExercises = [...baseExercises, dataToSave as CustomExerciseType];
            toast({ title: "성공", description: `운동 "${dataToSave.koreanName}"이(가) 추가되었습니다.` });
        }
        
        await updateDoc(exercisesDocRef, { [selectedGrade]: updatedExercises });
        
        setIsManageExerciseDialogOpen(false);
        setExerciseToEdit(null);
    } catch (error) {
        console.error("Error saving custom exercise: ", error);
        toast({ title: "오류", description: "운동 저장에 실패했습니다.", variant: "destructive"});
    }
  };

  const openAddExerciseDialog = () => {
    setExerciseToEdit(null);
    setIsManageExerciseDialogOpen(true);
  };
  
  const resetExercisesToDefault = async () => {
    if (!selectedGrade) {
        toast({title: "오류", description: "초기화할 학년을 선택해주세요.", variant: "destructive"});
        return;
    }
    try {
      const exercisesDocRef = doc(db, EXERCISES_BY_GRADE_DOC_PATH);
      await updateDoc(exercisesDocRef, { [selectedGrade]: EXERCISES_SEED_DATA });
      toast({title: "성공", description: `${selectedGrade}학년 운동 목록이 기본값으로 초기화되었습니다.`});
    } catch (error) {
      toast({title: "오류", description: "운동 목록 초기화에 실패했습니다.", variant: "destructive"});
    }
  };

  const requestDeleteExercise = (exercise: CustomExerciseType) => {
    setExerciseToDelete(exercise);
  };

  const confirmDeleteExercise = async () => {
    if (exerciseToDelete && selectedGrade) {
        try {
            const exercisesDocRef = doc(db, EXERCISES_BY_GRADE_DOC_PATH);
            const baseExercises = exercisesForCurrentGrade;
            const updatedExercises = baseExercises.filter(ex => ex.id !== exerciseToDelete.id);
            await updateDoc(exercisesDocRef, { [selectedGrade]: updatedExercises });
            toast({ title: "성공", description: `운동 "${exerciseToDelete.koreanName}"이(가) 삭제되었습니다.` });
        } catch (error) {
            console.error("Error deleting exercise: ", error);
            toast({ title: "오류", description: "운동 삭제에 실패했습니다.", variant: "destructive" });
        }
    }
    setExerciseToDelete(null);
  };

  const openEditExerciseDialog = (exercise: CustomExerciseType) => {
    setExerciseToEdit(exercise);
    setIsManageExerciseDialogOpen(true);
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

  const handlePreviousDay = () => {
    setSelectedLogDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedLogDate(prevDate => addDays(prevDate, 1));
  };
  
  const handleViewStudentPlan = (student: Student) => {
    setSelectedStudentForPlan(student);
  };
  
  const handleCloseStudentPlanDialog = () => {
      setSelectedStudentForPlan(null);
  };

  const handleAssignManito = async () => {
      if (!selectedClass || studentsInClass.length < 2) {
          toast({
              title: "오류",
              description: "마니또를 배정하려면 학급을 선택해야 하며, 최소 2명의 학생이 있어야 합니다.",
              variant: "destructive",
          });
          return;
      }

      setIsAssigningManito(true);
      try {
          const studentIds = studentsInClass.map(s => s.id);
          for (let i = studentIds.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
          }

          const assignments: ManitoAssignment = {};
          for (let i = 0; i < studentIds.length; i++) {
              assignments[studentIds[i]] = studentIds[(i + 1) % studentIds.length];
          }

          const gradeMatch = selectedClass.match(/(\d+)학년/);
          const classNumMatch = selectedClass.match(/(\d+)반/);
          const assignmentDocId = `${gradeMatch![1]}_${classNumMatch![1]}`;
          const assignmentDocRef = doc(db, "manitoAssignments", assignmentDocId);

          await setDoc(assignmentDocRef, assignments);

          toast({
              title: "성공!",
              description: `${selectedClass} 마니또 배정이 완료되었습니다.`,
          });
      } catch (error) {
          console.error("Error assigning manito:", error);
          toast({
              title: "오류",
              description: "마니또 배정 중 오류가 발생했습니다.",
              variant: "destructive",
          });
      } finally {
          setIsAssigningManito(false);
      }
  };

  const isNextDayDisabled = isToday(selectedLogDate) || selectedLogDate > new Date();

  const logsForClass = useMemo(() => {
    if (!selectedClass) return [];
    return recordedExercises.filter(log => log.className === selectedClass);
  }, [selectedClass, recordedExercises]);


  const isLoading = isLoadingStudents || isLoadingLogs || isLoadingCompliments || isLoadingRecommendations || isLoadingCustomExercises || isLoadingStudentGoals;

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
                      <SelectItem key={grade} value={grade}>{grade}학년</SelectItem>
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 h-auto rounded-lg p-1.5">
            <TabsTrigger value="students" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Users className="mr-2 h-5 w-5" /> 학생 목록
            </TabsTrigger>
            <TabsTrigger value="log" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ListChecks className="mr-2 h-5 w-5" /> 활동 기록
            </TabsTrigger>
             <TabsTrigger value="weeklyPlan" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <CalendarDays className="mr-2 h-5 w-5" /> 주간 계획
            </TabsTrigger>
             <TabsTrigger value="gallery" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ImageIconLucide className="mr-2 h-5 w-5" /> 사진 갤러리
            </TabsTrigger>
            <TabsTrigger value="summary" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <BarChart2 className="mr-2 h-5 w-5" /> 요약
            </TabsTrigger>
            <TabsTrigger value="ai" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Lightbulb className="mr-2 h-5 w-5" /> AI 코치
            </TabsTrigger>
             <TabsTrigger value="noticeManagement" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Megaphone className="mr-2 h-5 w-5" /> 공지/자료
            </TabsTrigger>
            <TabsTrigger value="manito" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Heart className="mr-2 h-5 w-5" /> 마니또
            </TabsTrigger>
            <TabsTrigger value="exerciseManagement" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Settings2 className="mr-2 h-5 w-5" /> 운동 관리
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
              <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                <h2 id="student-list-heading" className="text-xl font-semibold font-headline">
                  {selectedClass ? `${selectedClass} 학생들` : '전체 학생 목록'}
                </h2>
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddStudentDialogOpen(true)} className="rounded-lg">
                    <UserPlus className="mr-2 h-5 w-5" /> 학생 추가
                  </Button>
                   <Button onClick={() => setIsBatchAddDialogOpen(true)} variant="outline" className="rounded-lg">
                    <FileUp className="mr-2 h-5 w-5" /> 일괄 추가
                  </Button>
                </div>
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
                    />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="log" className="mt-6">
             <section aria-labelledby="activity-log-heading">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h2 id="activity-log-heading" className="text-xl font-semibold font-headline">
                    {selectedClass ? `${selectedClass} 학급` : '전체'} 활동 기록 ({format(selectedLogDate, "yyyy년 MM월 dd일", { locale: ko })})
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousDay} aria-label="이전 날짜">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !selectedLogDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-5 w-5" />
                          {selectedLogDate ? format(selectedLogDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedLogDate}
                          onSelect={(date) => date && setSelectedLogDate(date)}
                          initialFocus
                          locale={ko}
                          disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isNextDayDisabled} aria-label="다음 날짜">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                {isLoadingLogs || isLoadingStudents || isLoadingCustomExercises || isLoadingStudentGoals ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !selectedClass ? (
                   <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <School className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">활동 기록을 보려면 먼저 학급을 선택해주세요.</p>
                  </div>
                ) : studentsInClass.length === 0 ? (
                   <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <Users className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">{selectedClass} 학급에 등록된 학생이 없습니다.</p>
                    <p className="text-sm">먼저 '학생 목록' 탭에서 학생을 추가해주세요.</p>
                  </div>
                ) : exercisesForCurrentGrade.length === 0 ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <Settings2 className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">설정된 운동 목록이 없습니다.</p>
                    <p className="text-sm">먼저 '운동 관리' 탭에서 운동을 설정하거나 초기화해주세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-card p-4 rounded-xl shadow-md">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] sticky left-0 bg-card z-10">번호</TableHead>
                          <TableHead className="w-[120px] sticky left-[60px] bg-card z-10">이름</TableHead>
                          {exercisesForCurrentGrade.map(ex => (
                            <TableHead key={ex.id} className="text-center min-w-[120px] whitespace-nowrap">{ex.koreanName}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsInClass.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="sticky left-0 bg-card z-10">{student.studentNumber}</TableCell>
                            <TableCell className="sticky left-[60px] bg-card z-10">{student.name}</TableCell>
                            {exercisesForCurrentGrade.map(exercise => {
                              const studentLogsForExerciseSelectedDate = recordedExercises.filter(log =>
                                log.studentId === student.id &&
                                log.exerciseId === exercise.id &&
                                isSameDay(parseISO(log.date), selectedLogDate)
                              );

                              const studentGoalForExercise = goalsForSelectedDate[student.id]?.[exercise.id];

                              let achievedValue = 0;
                              let goalValue: number | undefined = undefined;
                              let unit = '';
                              let hasGoal = false;

                              if (exercise.category === 'count_time') {
                                if(exercise.countUnit){
                                  achievedValue = studentLogsForExerciseSelectedDate.reduce((sum, log) => sum + (log.countValue || 0), 0);
                                  unit = exercise.countUnit;
                                  if (studentGoalForExercise?.count !== undefined) {
                                    goalValue = studentGoalForExercise.count;
                                    hasGoal = true;
                                  }
                                } else if (exercise.timeUnit) {
                                  achievedValue = studentLogsForExerciseSelectedDate.reduce((sum, log) => sum + (log.timeValue || 0), 0);
                                  unit = exercise.timeUnit;
                                  if (studentGoalForExercise?.time !== undefined) {
                                    goalValue = studentGoalForExercise.time;
                                    hasGoal = true;
                                  }
                                }
                              } else if (exercise.category === 'steps_distance') {
                                achievedValue = studentLogsForExerciseSelectedDate.reduce((sum, log) => sum + (log.stepsValue || 0), 0);
                                unit = exercise.stepsUnit || '걸음';
                                if (studentGoalForExercise?.steps !== undefined) {
                                  goalValue = studentGoalForExercise.steps;
                                  hasGoal = true;
                                }
                              }

                              const percentage = goalValue !== undefined && goalValue > 0
                                               ? Math.min(100, Math.round((achievedValue / goalValue) * 100))
                                               : (achievedValue > 0 ? 100 : 0);
                              
                              const DisplayExerciseIcon = getIconByName(exercise.iconName);
                              const exerciseColor = `hsl(var(--chart-${(exercisesForCurrentGrade.findIndex(ex => ex.id === exercise.id) % 5) + 1}))`;


                              if (achievedValue === 0 && (!hasGoal || (goalValue !== undefined && goalValue === 0))) {
                                return (
                                  <TableCell key={exercise.id} className="text-center align-middle p-1">
                                    <div className="flex items-center justify-center h-20">
                                      <span className="text-muted-foreground">-</span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={exercise.id} className="text-center align-middle p-1 min-w-[120px]">
                                  <div className="flex flex-col items-center justify-center">
                                    <div
                                      className="relative w-16 h-16 rounded-full flex items-center justify-center"
                                      style={{
                                        background: `conic-gradient(${exerciseColor} ${percentage}%, hsl(var(--muted)) ${percentage}%)`
                                      }}
                                    >
                                      <div className="absolute w-[calc(100%-16px)] h-[calc(100%-16px)] bg-card rounded-full flex flex-col items-center justify-center shadow-inner p-1">
                                        {DisplayExerciseIcon && <DisplayExerciseIcon className="h-4 w-4 mb-0.5" style={{ color: exerciseColor }} />}
                                        <span className="text-xs font-bold truncate" style={{ color: exerciseColor }}>
                                          {percentage}%
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight text-center max-w-[100px] break-words">
                                      {hasGoal && goalValue !== undefined && goalValue > 0 ? (
                                        <>
                                          {achievedValue}{unit} / {" "}
                                          <span className="text-foreground/80 font-medium">{goalValue}{unit}</span>
                                        </>
                                      ) : achievedValue > 0 ? (
                                        `${achievedValue}${unit}`
                                      ) : (
                                        '-'
                                      )}
                                    </p>
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
             </section>
          </TabsContent>

          <TabsContent value="weeklyPlan" className="mt-6">
            <section aria-labelledby="weekly-plan-heading">
              <h2 id="weekly-plan-heading" className="sr-only">학급 주간 계획</h2>
              <ClassWeeklyPlan 
                studentsInClass={studentsInClass}
                allStudentDailyGoals={allStudentDailyGoals}
                availableExercises={exercisesForCurrentGrade}
                isLoading={isLoadingStudentGoals}
                selectedClass={selectedClass}
                onViewStudentPlan={handleViewStudentPlan}
              />
            </section>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <section aria-labelledby="photo-gallery-heading" className="bg-card p-6 rounded-xl shadow-md">
              <h2 id="photo-gallery-heading" className="text-xl font-semibold mb-4 font-headline flex items-center">
                <ImageIconLucide className="mr-3 h-6 w-6 text-primary" />
                사진 갤러리
              </h2>
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                <Construction className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">개발 예정입니다.</p>
                <p className="text-sm text-muted-foreground">
                  학생들의 멋진 인증샷을 모아볼 수 있는 공간이 준비될 예정입니다!
                </p>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <section aria-labelledby="class-summary-heading">
              <h2 id="class-summary-heading" className="sr-only">학급 요약</h2>
              {isLoading || isLoadingStudents || isLoadingLogs || isLoadingCustomExercises || isLoadingStudentGoals ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !selectedClass ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <School className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">요약 정보를 보려면 먼저 학급을 선택해주세요.</p>
                  </div>
                ) : studentsInClass.length === 0 ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <Users className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">{selectedClass} 학급에 등록된 학생이 없습니다.</p>
                    <p className="text-sm">먼저 '학생 목록' 탭에서 학생을 추가해주세요.</p>
                  </div>
                ) : exercisesForCurrentGrade.length === 0 ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center">
                    <Settings2 className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg">설정된 운동 목록이 없습니다.</p>
                    <p className="text-sm">먼저 '운동 관리' 탭에서 운동을 설정하거나 초기화해주세요.</p>
                  </div>
                ) : (
                  <ClassSummaryStats
                    selectedClass={selectedClass}
                    studentsInClass={studentsInClass}
                    recordedExercises={recordedExercises}
                    customExercises={exercisesForCurrentGrade}
                    allStudentGoals={goalsForSelectedDate}
                    selectedLogDate={selectedLogDate}
                  />
              )}
            </section>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
             <section aria-labelledby="ai-suggestion-heading">
                <h2 id="ai-suggestion-heading" className="sr-only">AI 운동 제안</h2>
                <AiSuggestionBox
                    studentsInClass={studentsInClass}
                    logsForClass={logsForClass}
                    availableExercises={exercisesForCurrentGrade}
                    selectedClass={selectedClass}
                />
              </section>
          </TabsContent>
          
          <TabsContent value="noticeManagement" className="mt-6">
            <section aria-labelledby="notice-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <h2 id="notice-management-heading" className="text-xl font-semibold mb-4 font-headline flex items-center">
                  <Megaphone className="mr-3 h-6 w-6 text-primary" />
                  공지 및 학습자료 관리
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Target Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notice-grade">대상 학년</Label>
                    <Select value={noticeGrade} onValueChange={setNoticeGrade}>
                      <SelectTrigger id="notice-grade"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}학년</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notice-class">대상 반</Label>
                    <Select value={noticeClass} onValueChange={setNoticeClass} disabled={!noticeGrade}>
                      <SelectTrigger id="notice-class"><SelectValue placeholder="반 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {classNumsForGrade.map(c => <SelectItem key={c} value={c}>{c}반</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                 {/* Right side: Notice Content */}
                <div className="space-y-4">
                  {isNoticeLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : (
                  <>
                  <div className="space-y-2">
                    <Label htmlFor="notice-message">공지 내용</Label>
                    <Textarea id="notice-message" value={noticeMessage} onChange={e => setNoticeMessage(e.target.value)} placeholder="학생들에게 보여줄 메시지를 입력하세요..." rows={5}/>
                  </div>
                  <div className="space-y-2">
                    <Label>첨부 파일/링크 종류</Label>
                     <RadioGroup value={attachmentType} onValueChange={(v: any) => setAttachmentType(v)} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="none" /><Label htmlFor="none">없음</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="url" /><Label htmlFor="url">URL</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="youtube" id="youtube" /><Label htmlFor="youtube">YouTube</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="file" id="file" /><Label htmlFor="file">파일</Label></div>
                    </RadioGroup>
                  </div>
                    {(attachmentType === 'url' || attachmentType === 'youtube') && (
                       <Input type="text" placeholder={attachmentType === 'youtube' ? "YouTube 영상 URL 붙여넣기" : "https://..."} value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} />
                    )}
                    {attachmentType === 'file' && (
                        <div>
                          <Input type="file" onChange={e => setAttachmentFile(e.target.files ? e.target.files[0] : null)} />
                          {currentNotice?.attachment?.type === 'file' && !attachmentFile && (
                            <p className="text-xs text-muted-foreground mt-1">현재 파일: <a href={currentNotice.attachment.url} target="_blank" rel="noopener noreferrer" className="underline">{currentNotice.attachment.fileName}</a></p>
                          )}
                           <p className="text-xs text-muted-foreground mt-1">파일은 5MB 미만으로 업로드해주세요.</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNotice} disabled={isUploading || !noticeGrade} className="flex-1">
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isUploading ? "저장 중..." : "저장하기"}
                      </Button>
                      {currentNotice && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={isUploading}><Trash2 className="mr-2 h-4 w-4" />삭제</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                             <AlertDialogHeader>
                              <AlertDialogTitle>공지를 삭제하시겠습니까?</AlertDialogTitle>
                              <AlertDialogDescription>이 작업은 되돌릴 수 없으며, 첨부된 파일도 함께 영구적으로 삭제됩니다.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={handleClearNotice}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </>
                  )}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="manito" className="mt-6">
              <section aria-labelledby="manito-heading" className="bg-card p-6 rounded-xl shadow-md">
                  <h2 id="manito-heading" className="text-xl font-semibold mb-4 font-headline flex items-center">
                      <Heart className="mr-3 h-6 w-6 text-primary" />
                      마니또(비밀친구) 관리
                  </h2>
                  <div className="space-y-4">
                      <Button onClick={handleAssignManito} disabled={isAssigningManito || !selectedClass} className="rounded-lg">
                          {isAssigningManito ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
                          {manitoAssignments ? `${selectedClass} 마니또 재배정` : '마니또 배정하기'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                          선택된 학급의 학생들을 대상으로 마니또를 배정합니다. 각 학생은 다른 학생의 비밀친구가 됩니다.
                      </p>
                      
                      {manitoAssignments && studentsInClass.length > 0 ? (
                          <div className="overflow-x-auto">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>마니또 (수호자)</TableHead>
                                          <TableHead>비밀친구 (도와줄 친구)</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {Object.entries(manitoAssignments).map(([manitoId, secretFriendId]) => {
                                          const manitoStudent = studentsInClass.find(s => s.id === manitoId);
                                          const secretFriendStudent = studentsInClass.find(s => s.id === secretFriendId);
                                          if (!manitoStudent || !secretFriendStudent) return null;
                                          return (
                                              <TableRow key={manitoId}>
                                                  <TableCell>{manitoStudent.name} ({manitoStudent.studentNumber}번)</TableCell>
                                                  <TableCell>{secretFriendStudent.name} ({secretFriendStudent.studentNumber}번)</TableCell>
                                              </TableRow>
                                          );
                                      })}
                                  </TableBody>
                              </Table>
                          </div>
                      ) : selectedClass ? (
                          <p className="text-sm text-muted-foreground">
                              {studentsInClass.length < 2 ? "마니또를 배정하려면 학생이 2명 이상 필요합니다." : "아직 배정된 마니또가 없습니다. '마니또 배정하기' 버튼을 눌러 시작하세요."}
                          </p>
                      ) : null}
                  </div>
              </section>
          </TabsContent>

          <TabsContent value="exerciseManagement" className="mt-6">
            <section aria-labelledby="exercise-management-heading" className="bg-card p-6 rounded-xl shadow-md">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 id="exercise-management-heading" className="text-xl font-semibold font-headline flex items-center">
                  <Settings2 className="mr-3 h-6 w-6 text-primary" />
                  {selectedGrade ? `${selectedGrade}학년 운동 목록 관리 (최대 6개)` : '먼저 학급을 선택해주세요'}
                </h2>
                <div className="flex gap-2">
                    <Button onClick={openAddExerciseDialog} className="rounded-lg" disabled={!selectedGrade || exercisesForCurrentGrade.length >= 6}>
                      <PlusCircle className="mr-2 h-5 w-5" /> 새 운동 추가
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="rounded-lg" disabled={!selectedGrade}>
                          <RotateCcw className="mr-2 h-5 w-5" /> 기본값으로 초기화
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말 초기화하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            현재 설정된 모든 운동이 삭제되고, 4개의 기본 운동으로 재설정됩니다. 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={resetExercisesToDefault}>초기화</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
              {isLoadingCustomExercises ? (
                 <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> 운동 목록 로딩 중...</div>
              ) : !selectedGrade ? (
                  <div className="text-center py-6 text-muted-foreground">운동을 관리할 학급을 먼저 선택해주세요.</div>
              ) : (
                <div className="space-y-4">
                  {exercisesForCurrentGrade.map((ex) => {
                    const Icon = getIconByName(ex.iconName) || ActivityIcon;
                    return (
                       <Card key={ex.id} className="shadow-sm">
                        <CardHeader className="flex flex-row justify-between items-start">
                          <div>
                            <UICardTitle className="text-lg flex items-center">
                               <Icon className="mr-2 h-5 w-5 text-muted-foreground" /> {ex.koreanName}
                            </UICardTitle>
                            <UICardDescription className="text-xs">
                                {ex.category === 'count_time' ? (ex.countUnit ? `횟수(${ex.countUnit})` : `시간(${ex.timeUnit})`) : `걸음(${ex.stepsUnit})`} 기반
                            </UICardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditExerciseDialog(ex)} aria-label="운동 수정">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => requestDeleteExercise(ex)} aria-label="운동 삭제">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                {exerciseToDelete && exerciseToDelete.id === ex.id && (
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>운동 삭제 확인</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <strong>{ex.koreanName}</strong> 운동을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDeleteExercise} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        삭제
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                )}
                            </AlertDialog>
                          </div>
                        </CardHeader>
                       </Card>
                    );
                  })}
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
        
        <BatchAddStudentsDialog
          isOpen={isBatchAddDialogOpen}
          onClose={() => setIsBatchAddDialogOpen(false)}
          onSave={handleBatchAddStudents}
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
        
        {selectedStudentForPlan && (
            <StudentWeeklyPlanDialog
                isOpen={!!selectedStudentForPlan}
                onClose={handleCloseStudentPlanDialog}
                student={selectedStudentForPlan}
                studentWeeklyGoals={allStudentDailyGoals[selectedStudentForPlan.id] || {}}
                availableExercises={exercisesForCurrentGrade}
            />
        )}

        {studentToDelete && (
            <AlertDialog open={!!studentToDelete} onOpenChange={(isOpen) => !isOpen && setStudentToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>학생 삭제 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{studentToDelete.name}</strong> ({studentToDelete.grade}학년 {studentToDelete.classNum}반 {studentToDelete.studentNumber}번) 학생을 정말 삭제하시겠습니까? 이 학생의 모든 운동 기록과 목표도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setStudentToDelete(null)}>취소</AlertDialogCancel>
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
