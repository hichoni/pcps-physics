
export interface PatchNote {
  version: string;
  date: string;
  features?: string[];
  fixes?: string[];
  improvements?: string[];
}

export const PATCH_NOTES: PatchNote[] = [
    {
        version: "v1.2.0",
        date: "2025-06-24",
        features: [
            "교사용 페이지에 '패치노트' 기능 추가",
            "비밀친구(마니또) 기능 추가! 친구에게 미션을 보내고 보너스 XP를 획득하세요.",
            "교사용 페이지에서 공지사항 및 교육자료(파일, URL, YouTube) 공유 기능 추가",
        ],
        improvements: [
            "학생 페이지 로딩 속도 개선 (AI 환영 메시지 캐싱 처리)",
            "학생 로그인 상태유지 기능 추가 (새로고침 시 재로그인 불필요)",
            "교사용 페이지 데이터 실시간 업데이트 기능 적용 (학생 활동 즉시 반영)",
            "학생 목표 카드 클릭 시 바로 운동 기록 양식으로 연결되도록 개선",
        ],
        fixes: [
            "일부 학급의 학생 목록이 보이지 않던 문제 수정",
            "교사 페이지에서 특정 아이콘이 누락되어 발생하던 오류 수정",
            "학생 랭킹 박스가 사라지던 문제 수정",
        ],
    },
    {
        version: "v1.0.0",
        date: "2025-06-23",
        features: [
            "풍풍이 체력탐험대 앱 정식 출시!",
            "학생별 운동 목표 설정 및 기록 기능",
            "교사용 학급 관리 및 학생 데이터 확인 기능",
            "AI 기반 운동 추천 및 환영 메시지 기능",
        ],
    }
];
