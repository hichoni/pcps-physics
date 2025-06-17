
import type React from 'react';

export type ClassName = '3학년 1반' | '3학년 2반' | '3학년 3반' | '3학년 4반' | '3학년 5반';

export const ALL_CLASSES: ClassName[] = ['3학년 1반', '3학년 2반', '3학년 3반', '3학년 4반', '3학년 5반'];

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
  timeUnit?: string; // e.g., '분'
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
  timeValue?: number;     // 단위: 분
  
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
  time?: number; // 목표 시간 (분)
  steps?: number; // 목표 걸음 수
  distance?: number; // 목표 거리 (m)
}

export type StudentGoal = Record<string, ExerciseGoal>; // exerciseId를 키로 가짐

