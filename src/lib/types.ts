
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
  category: ExerciseCategory; // 카테고리는 유지하되, 실제 사용은 아래 필드에 따름

  // 스쿼트, 줄넘기용
  countUnit?: string; 
  defaultCount?: number;
  countStep?: number;

  // 플랭크용
  timeUnit?: string; 
  defaultTime?: number;
  timeStep?: number;

  // 걷기/달리기용
  stepsUnit?: string; 
  defaultSteps?: number;
  stepsStep?: number;
  distanceUnit?: string; // 사용 안 함
  defaultDistance?: number; // 사용 안 함
  distanceStep?: number; // 사용 안 함

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
  exerciseId: string; // CustomExercise의 id와 매칭
  date: string; 
  
  // exerciseId에 따라 아래 값 중 하나만 사용됨
  countValue?: number;    // 스쿼트, 줄넘기
  timeValue?: number;     // 플랭크
  stepsValue?: number;    // 걷기/달리기 (걸음 단위)
  
  distanceValue?: number; // 사용 안 함 (걷기/달리기에서 걸음으로 통일)
  
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

// 각 운동 ID에 대해 해당 운동의 주 목표 값만 저장
// 예: studentGoals['squat'] = { count: 20 }
// 예: studentGoals['walk_run'] = { steps: 500 }
export interface ExerciseGoal {
  count?: number; 
  time?: number; 
  steps?: number; 
  distance?: number; // 레거시 필드지만 유지, steps를 우선 사용
}

export type StudentGoal = Record<string, ExerciseGoal>; // key는 CustomExercise의 id

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
  maxXp: number; // 다음 레벨로 가기 위한 XP (Level 10은 Infinity)
  colorClass: string; // 레벨 표시를 위한 Tailwind CSS 색상 클래스
}
