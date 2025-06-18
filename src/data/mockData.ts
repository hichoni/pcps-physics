
import type { CustomExercise } from '@/lib/types'; // Exercise 대신 CustomExercise 사용

// CLASSES and STUDENTS_DATA are removed as data will be managed in Firestore by the teacher.

// 이 EXERCISES_SEED_DATA는 Firestore에 초기 데이터가 없을 경우
// 교사가 "기본 운동 목록으로 초기화" 같은 기능을 통해 사용할 수 있는 시드 데이터입니다.
// 학생 앱에서는 직접 사용하지 않고, Firestore에서 데이터를 가져옵니다.
export const EXERCISES_SEED_DATA: CustomExercise[] = [
  { 
    id: 'seed_ex1', 
    koreanName: '스쿼트 (기본)', 
    iconName: 'Dumbbell', // Lucide 아이콘 이름 문자열
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
    id: 'seed_ex2', 
    koreanName: '플랭크 (기본)', 
    iconName: 'Activity',
    category: 'count_time',
    countUnit: '회', 
    defaultCount: 1, 
    countStep: 1,
    timeUnit: '초', 
    defaultTime: 30, 
    timeStep: 10,
    dataAiHint: 'child plank'
  },
  { 
    id: 'seed_ex3', 
    koreanName: '걷기/달리기 (기본)', 
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
    id: 'seed_ex4', 
    koreanName: '줄넘기 (기본)', 
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
