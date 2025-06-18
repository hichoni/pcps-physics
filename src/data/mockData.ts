
import type { CustomExercise } from '@/lib/types';

// EXERCISES_SEED_DATA는 Firestore에 초기 데이터가 없을 경우
// 또는 교사가 "기본 운동 목록으로 초기화" 기능을 통해 사용할 수 있는 시드 데이터입니다.
// 학생 앱에서는 직접 사용하지 않고, Firestore에서 데이터를 가져옵니다.
// 운동 종류를 4가지로 제한하고, 각 운동에 단일 지표만 사용하도록 수정합니다.
export const EXERCISES_SEED_DATA: CustomExercise[] = [
  { 
    id: 'squat', 
    koreanName: '스쿼트', 
    iconName: 'Dumbbell',
    category: 'count_time', // 내부적으로는 count만 사용
    countUnit: '회', 
    defaultCount: 10, 
    countStep: 1,
    timeUnit: undefined, 
    defaultTime: undefined, 
    timeStep: undefined,
    stepsUnit: undefined,
    defaultSteps: undefined,
    stepsStep: undefined,
    distanceUnit: undefined,
    defaultDistance: undefined,
    distanceStep: undefined,
    dataAiHint: 'child squat' 
  },
  { 
    id: 'plank', 
    koreanName: '플랭크', 
    iconName: 'Activity', // PlankIcon이 없으므로 Activity로 대체 또는 사용자 정의 아이콘 필요
    category: 'count_time', // 내부적으로는 time(초)만 사용
    countUnit: undefined, 
    defaultCount: undefined, 
    countStep: undefined,
    timeUnit: '초', 
    defaultTime: 30, 
    timeStep: 10,
    stepsUnit: undefined,
    defaultSteps: undefined,
    stepsStep: undefined,
    distanceUnit: undefined,
    defaultDistance: undefined,
    distanceStep: undefined,
    dataAiHint: 'child plank'
  },
  { 
    id: 'walk_run', 
    koreanName: '걷기/달리기', 
    iconName: 'Footprints',
    category: 'steps_distance', // 내부적으로는 distance(m)만 사용
    countUnit: undefined, 
    defaultCount: undefined, 
    countStep: undefined,
    timeUnit: undefined, 
    defaultTime: undefined, 
    timeStep: undefined,
    stepsUnit: undefined, // '걸음' 사용 안함
    defaultSteps: undefined,
    stepsStep: undefined,
    distanceUnit: 'm',
    defaultDistance: 500,
    distanceStep: 50,
    dataAiHint: 'child running'
  },
  { 
    id: 'jump_rope', 
    koreanName: '줄넘기', 
    iconName: 'Zap', // JumpRopeIcon이 없으므로 Zap으로 대체 또는 사용자 정의 아이콘 필요
    category: 'count_time', // 내부적으로는 count만 사용
    countUnit: '회',
    defaultCount: 50,
    countStep: 10,
    timeUnit: undefined,
    defaultTime: undefined,
    timeStep: undefined,
    stepsUnit: undefined,
    defaultSteps: undefined,
    stepsStep: undefined,
    distanceUnit: undefined,
    defaultDistance: undefined,
    distanceStep: undefined,
    dataAiHint: 'child jump rope'
  },
];
