
import type { LucideIcon } from 'lucide-react'; 

export type ClassName = string; 

export type Gender = 'male' | 'female';

export interface Student {
  id: string;
  name: string;
  class: ClassName;
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
  
  className: ClassName;
  imageUrl?: string; 
}

export interface AiSuggestion {
  suggestedExercise: string;
  reasoning: string;
}

export interface DailyLog {
  date: string; 
  className: ClassName;
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
