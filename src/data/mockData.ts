
import type { CustomExercise } from '@/lib/types';

// EXERCISES_SEED_DATA는 Firestore에 초기 데이터가 없을 경우
// 또는 교사가 "기본 운동 목록으로 초기화" 기능을 통해 사용할 수 있는 시드 데이터입니다.
export const EXERCISES_SEED_DATA: CustomExercise[] = [
  { 
    id: 'squat', 
    koreanName: '스쿼트', 
    iconName: 'Dumbbell',
    category: 'count_time',
    countUnit: '회', 
    defaultCount: 20, 
    countStep: 1,
    dataAiHint: 'child squat' 
  },
  { 
    id: 'plank', 
    koreanName: '플랭크', 
    iconName: 'Activity',
    category: 'count_time',
    timeUnit: '초', 
    defaultTime: 30, 
    timeStep: 5,
    dataAiHint: 'child plank'
  },
  { 
    id: 'walk_run', 
    koreanName: '걷기/달리기', 
    iconName: 'Footprints',
    category: 'steps_distance',
    stepsUnit: '걸음',
    defaultSteps: 500,
    stepsStep: 50,
    dataAiHint: 'child running'
  },
  { 
    id: 'jump_rope', 
    koreanName: '줄넘기', 
    iconName: 'Zap',
    category: 'count_time',
    countUnit: '회',
    defaultCount: 200,
    countStep: 20,
    dataAiHint: 'child jump rope'
  },
];
