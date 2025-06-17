
import type { Exercise } from '@/lib/types'; // Student and ClassName removed
import { Footprints } from 'lucide-react';
import { SquatIcon, PlankIcon, JumpRopeIcon } from '@/components/icons';

// CLASSES and STUDENTS_DATA are removed as data will be managed in Firestore by the teacher.

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
