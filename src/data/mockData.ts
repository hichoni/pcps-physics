
import type { Student, Exercise, ClassName } from '@/lib/types';
import { Footprints } from 'lucide-react';
import { SquatIcon, PlankIcon, JumpRopeIcon } from '@/components/icons';

export const CLASSES: ClassName[] = []; // Changed: Empty array

export const STUDENTS_DATA: Student[] = []; // Changed: Empty array

export const EXERCISES: Exercise[] = [
  { 
    id: 'ex1', 
    koreanName: '스쿼트', 
    icon: SquatIcon, 
    category: 'count_time',
    countUnit: '회', 
    defaultCount: 10, 
    countStep: 1,
    timeUnit: '분', 
    defaultTime: 1, 
    timeStep: 1,
    dataAiHint: 'child squat' 
  },
  { 
    id: 'ex2', 
    koreanName: '플랭크', 
    icon: PlankIcon, 
    category: 'count_time',
    countUnit: '회', 
    defaultCount: 3, 
    countStep: 1,
    timeUnit: '분', 
    defaultTime: 0.5, 
    timeStep: 0.5, 
    dataAiHint: 'child plank'
  },
  { 
    id: 'ex3', 
    koreanName: '걷기/달리기', 
    icon: Footprints, 
    category: 'steps_distance',
    stepsUnit: '걸음',
    defaultSteps: 1000,
    stepsStep: 100,
    distanceUnit: 'm',
    defaultDistance: 500,
    distanceStep: 50,
    dataAiHint: 'child running'
  },
  { 
    id: 'ex4', 
    koreanName: '줄넘기', 
    icon: JumpRopeIcon, 
    category: 'count_time',
    countUnit: '회',
    defaultCount: 50,
    countStep: 10,
    timeUnit: '분',
    defaultTime: 1,
    timeStep: 1,
    dataAiHint: 'child jump rope'
  },
];
