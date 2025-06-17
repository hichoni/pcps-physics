import type React from 'react';

export type ClassName = 'Class 3A' | 'Class 3B' | 'Class 3C' | 'Class 3D' | 'Class 3E';

export const ALL_CLASSES: ClassName[] = ['Class 3A', 'Class 3B', 'Class 3C', 'Class 3D', 'Class 3E'];

export interface Student {
  id: string;
  name: string;
  class: ClassName;
  avatarSeed: string; // Seed for generating consistent placeholder avatar
}

export interface Exercise {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  unit: 'reps' | 'minutes';
  defaultLogValue: number;
  step: number;
  dataAiHint: string; // For placeholder images if exercise specific images were used
}

export interface RecordedExercise {
  id: string;
  studentId: string;
  exerciseId: string;
  date: string; // ISO string YYYY-MM-DD
  value: number;
  className: ClassName;
}

export interface AiSuggestion {
  suggestedExercise: string;
  reasoning: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  className: ClassName;
  studentId: string;
  exerciseId: string;
  value: number;
}
