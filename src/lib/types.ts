
import type { LucideIcon } from 'lucide-react'; // LucideIcon 임포트

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
}

export type ExerciseCategory = 'count_time' | 'steps_distance';

export interface Exercise {
  id: string;
  koreanName: string; 
  icon: LucideIcon; // React.FC에서 LucideIcon으로 변경
  iconName: string; // Lucide 아이콘 이름을 위한 필드
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

export type StudentGoal = Record<string, ExerciseGoal>; 

export interface TeacherExerciseRecommendation {
  recommendationTitle: string;
  recommendationDetail: string;
}

// 교사가 관리할 운동 항목 타입 (Firestore 저장용)
export interface CustomExercise extends Omit<Exercise, 'icon'> {
  // icon 필드는 iconName으로 대체됨
}
