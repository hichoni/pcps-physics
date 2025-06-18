
import type { Exercise } from '@/lib/types';
import { Footprints, Dumbbell, Activity, Zap } from 'lucide-react'; // Lucide 아이콘 직접 임포트

// CLASSES and STUDENTS_DATA are removed as data will be managed in Firestore by the teacher.

export const EXERCISES: Exercise[] = [
  { 
    id: 'ex1', 
    koreanName: '스쿼트', 
    icon: Dumbbell, 
    iconName: 'Dumbbell',
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
    icon: Activity, 
    iconName: 'Activity',
    category: 'count_time',
    countUnit: '회', 
    defaultCount: 1, 
    countStep: 1,
    timeUnit: '초', 
    defaultTime: 30, 
    timeStep: 10, // 1초보다는 10초 단위가 조절하기 편할 수 있음
    dataAiHint: 'child plank'
  },
  { 
    id: 'ex3', 
    koreanName: '걷기/달리기', 
    icon: Footprints, 
    iconName: 'Footprints',
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
    icon: Zap, 
    iconName: 'Zap',
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
