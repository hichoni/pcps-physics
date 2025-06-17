
import type React from 'react';

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
  icon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
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
