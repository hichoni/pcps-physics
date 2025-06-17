import type { Student, Exercise, ClassName } from '@/lib/types';
import { Run } from 'lucide-react';
import { PushUpIcon, SitUpIcon, JumpingJacksIcon, StretchingIcon } from '@/components/icons';

export const CLASSES: ClassName[] = ['Class 3A', 'Class 3B', 'Class 3C', 'Class 3D', 'Class 3E'];

export const STUDENTS_DATA: Student[] = [
  { id: 's1', name: 'Alex Kim', class: 'Class 3A', avatarSeed: 'Alex' },
  { id: 's2', name: 'Bella Chen', class: 'Class 3A', avatarSeed: 'Bella' },
  { id: 's3', name: 'Charlie Davis', class: 'Class 3A', avatarSeed: 'Charlie' },
  { id: 's4', name: 'Diana Evans', class: 'Class 3A', avatarSeed: 'Diana' },
  { id: 's5', name: 'Ethan Foster', class: 'Class 3B', avatarSeed: 'Ethan' },
  { id: 's6', name: 'Fiona Green', class: 'Class 3B', avatarSeed: 'Fiona' },
  { id: 's7', name: 'George Hill', class: 'Class 3B', avatarSeed: 'George' },
  { id: 's8', name: 'Hannah Irwin', class: 'Class 3C', avatarSeed: 'Hannah' },
  { id: 's9', name: 'Ian Jones', class: 'Class 3C', avatarSeed: 'Ian' },
  { id: 's10', name: 'Julia King', class: 'Class 3D', avatarSeed: 'Julia' },
  { id: 's11', name: 'Kevin Lee', class: 'Class 3D', avatarSeed: 'Kevin' },
  { id: 's12', name: 'Laura Miller', class: 'Class 3E', avatarSeed: 'Laura' },
  { id: 's13', name: 'Noah Nelson', class: 'Class 3E', avatarSeed: 'Noah' },
  { id: 's14', name: 'Olivia Parker', class: 'Class 3E', avatarSeed: 'Olivia' },
  { id: 's15', name: 'Peter Quill', class: 'Class 3A', avatarSeed: 'Peter' },
];

export const EXERCISES: Exercise[] = [
  { id: 'ex1', name: 'Running', icon: Run, unit: 'minutes', defaultLogValue: 2, step: 1, dataAiHint: 'children running' },
  { id: 'ex2', name: 'Push-ups', icon: PushUpIcon, unit: 'reps', defaultLogValue: 5, step: 1, dataAiHint: 'child pushup' },
  { id: 'ex3', name: 'Sit-ups', icon: SitUpIcon, unit: 'reps', defaultLogValue: 10, step: 1, dataAiHint: 'child situp' },
  { id: 'ex4', name: 'Jumping Jacks', icon: JumpingJacksIcon, unit: 'reps', defaultLogValue: 15, step: 5, dataAiHint: 'child jumping' },
  { id: 'ex5', name: 'Stretching', icon: StretchingIcon, unit: 'minutes', defaultLogValue: 1, step: 1, dataAiHint: 'child stretching' },
];
