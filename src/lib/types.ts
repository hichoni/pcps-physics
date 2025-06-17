
import type React from 'react';

export type ClassName = string; // Changed: ClassName is now a string

export type Gender = 'male' | 'female';

export interface Student {
  id: string;
  name: string;
  class: ClassName;
  studentNumber: number;
  gender: Gender;
  avatarSeed: string;
}

export type ExerciseCategory = 'count_time' | 'steps_distance';

export interface Exercise {
  id: string;
  koreanName: string; 
  icon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  category: ExerciseCategory;

  // For 'count_time' category (스쿼트, 플랭크, 줄넘기)
  countUnit?: string; // e.g., '회'
  defaultCount?: number;
  countStep?: number;
  timeUnit?: string; // e.g., '분' or '초'
  defaultTime?: number;
  timeStep?: number;

  // For 'steps_distance' category (걷기/달리기)
  stepsUnit?: string; // e.g., '걸음'
  defaultSteps?: number;
  stepsStep?: number;
  distanceUnit?: string; // e.g., 'm' (미터)
  defaultDistance?: number;
  distanceStep?: number;

  dataAiHint: string;
}

export interface RecordedExercise {
  id: string;
  studentId: string;
  exerciseId: string;
  date: string; // ISO string YYYY-MM-DD
  
  countValue?: number;    
  timeValue?: number;     // 단위: 운동에 따라 분 또는 초
  
  stepsValue?: number;    
  distanceValue?: number; // 단위: m
  
  className: ClassName;
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

// 학생별 운동 목표 타입
export interface ExerciseGoal {
  count?: number; // 목표 횟수
  time?: number; // 목표 시간 (운동 단위에 따라 분 또는 초)
  steps?: number; // 목표 걸음 수
  distance?: number; // 목표 거리 (m)
}

export type StudentGoal = Record<string, ExerciseGoal>; // exerciseId를 키로 가짐

// 교사가 직접 관리하는 추천 운동/팁 타입 (RecommendStudentExerciseOutput과 동일 구조)
export interface TeacherExerciseRecommendation {
  recommendationTitle: string;
  recommendationDetail: string;
}
