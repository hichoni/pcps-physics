import type { Student, Exercise, ClassName } from '@/lib/types';
import { Footprints } from 'lucide-react';
import { SquatIcon, PlankIcon, JumpRopeIcon } from '@/components/icons';

export const CLASSES: ClassName[] = ['3학년 1반', '3학년 2반', '3학년 3반', '3학년 4반', '3학년 5반'];

export const STUDENTS_DATA: Student[] = [
  { id: 's1', name: '김민준', class: '3학년 1반', avatarSeed: 'Minjun' },
  { id: 's2', name: '이서연', class: '3학년 1반', avatarSeed: 'Seoyeon' },
  { id: 's3', name: '박도윤', class: '3학년 1반', avatarSeed: 'Doyun' },
  { id: 's4', name: '최지우', class: '3학년 1반', avatarSeed: 'Jiwu' },
  { id: 's5', name: '정하준', class: '3학년 2반', avatarSeed: 'Hajun' },
  { id: 's6', name: '윤서아', class: '3학년 2반', avatarSeed: 'Seoa' },
  { id: 's7', name: '강시우', class: '3학년 2반', avatarSeed: 'Siwoo' },
  { id: 's8', name: '송하윤', class: '3학년 3반', avatarSeed: 'Hayun' },
  { id: 's9', name: '임예준', class: '3학년 3반', avatarSeed: 'Yejun' },
  { id: 's10', name: '오지아', class: '3학년 4반', avatarSeed: 'Jia' },
  { id: 's11', name: '한주원', class: '3학년 4반', avatarSeed: 'Juho' },
  { id: 's12', name: '문서윤', class: '3학년 5반', avatarSeed: 'Seoyun' },
  { id: 's13', name: '배은우', class: '3학년 5반', avatarSeed: 'Eunwoo' },
  { id: 's14', name: '조수아', class: '3학년 5반', avatarSeed: 'Sua' },
  { id: 's15', name: '황유준', class: '3학년 1반', avatarSeed: 'Yujun' },
];

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
    countUnit: '회', // "세트" 또는 "시도"로 해석될 수 있음
    defaultCount: 3, 
    countStep: 1,
    timeUnit: '분', // 또는 '초'로 하고 변환 로직 추가 가능
    defaultTime: 0.5, 
    timeStep: 0.5, // 30초 단위
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
