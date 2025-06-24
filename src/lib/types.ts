
import type { LucideIcon } from 'lucide-react'; 

export type Gender = 'male' | 'female';

export interface Student {
  id: string;
  name: string;
  grade: string; // 예: "1", "2", "3"
  classNum: string; // 예: "1", "2", "3"
  studentNumber: number;
  gender: Gender;
  avatarSeed: string;
  pin: string; 
  totalXp?: number; // 누적 경험치 필드 추가
}

export type ExerciseCategory = 'count_time' | 'steps_distance';

// 앱 내부에서 사용되는 Exercise 타입 (아이콘 컴포넌트 포함)
export interface Exercise {
  id: string;
  koreanName: string; 
  icon: LucideIcon; 
  iconName: string; 
  category: ExerciseCategory;

  countUnit?: string; 
  defaultCount?: number;
  countStep?: number;

  timeUnit?: string; 
  defaultTime?: number;
  timeStep?: number;

  stepsUnit?: string; 
  defaultSteps?: number;
  stepsStep?: number;
  distanceUnit?: string;
  defaultDistance?: number;
  distanceStep?: number;

  dataAiHint: string;
}

// Firestore에 저장될 운동 항목 타입 (아이콘 이름 문자열만 포함)
export interface CustomExercise {
  id: string; // UUID
  koreanName: string; 
  iconName: string; // Lucide 아이콘 이름 문자열
  category: ExerciseCategory;

  countUnit?: string; 
  defaultCount?: number;
  countStep?: number;

  timeUnit?: string; 
  defaultTime?: number;
  timeStep?: number;

  stepsUnit?: string;
  defaultSteps?: number;
  stepsStep?: number;

  distanceUnit?: string; 
  defaultDistance?: number;
  distanceStep?: number;
  
  dataAiHint: string;
}

export interface RecordedExercise {
  id: string;
  studentId: string;
  exerciseId: string;
  date: string; 
  
  countValue?: number;
  timeValue?: number;
  stepsValue?: number;
  
  distanceValue?: number;
  
  className: string; // 예: "1학년 1반"
  imageUrl?: string; 
}

export interface AiSuggestion {
  suggestedExercise: string;
  reasoning: string;
}

export interface DailyLog {
  date: string; 
  className: string;
  studentId: string;
  exerciseId: string;
  value: number; 
}

export interface ExerciseGoal {
  count?: number; 
  time?: number; 
  steps?: number; 
  distance?: number;
}

export type StudentGoal = Record<string, ExerciseGoal>; // key는 CustomExercise의 id

// Firestore 저장을 위한 일일 목표 데이터 타입
export interface DailyGoalEntry {
  goals: StudentGoal;
  skipped: string[]; // Firestore에는 Set이 아닌 배열로 저장
}

export interface TeacherExerciseRecommendation {
  recommendationTitle: string;
  recommendationDetail: string;
}

// 레벨 정보 인터페이스
export interface LevelInfo {
  level: number;
  name: string;
  icon: LucideIcon;
  minXp: number;
  maxXp: number;
  colorClass: string;
}

export interface TeacherMessage {
  id: string;
  grade: string;
  classNum: string; // "all" for entire grade
  message: string;
  attachment?: {
    type: 'file' | 'url' | 'youtube';
    url: string;
    fileName?: string;
    fileSize?: number;
  };
  createdAt: any; // Can be Firestore Timestamp
}

export interface ManitoAssignment {
  [studentId: string]: string; // key: studentId (마니또), value: their secret friend's ID (챙겨줘야 할 친구)
}

export interface MailboxMessage {
  id: string;
  fromId: string;
  toId: string;
  type: 'cheer' | 'mission';
  content: string;
  isRead: boolean;
  missionStatus?: 'pending' | 'completed';
  createdAt: any; // Firestore Timestamp
}
