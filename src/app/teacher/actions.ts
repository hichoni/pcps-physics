'use server';

import { createHash, timingSafeEqual } from 'crypto';

// 교사 PIN은 서버 환경 변수 TEACHER_PIN(App Hosting 비밀값)에만 있고,
// 브라우저로 내려가는 코드에는 들어가지 않습니다.
export async function verifyTeacherPin(pin: string): Promise<{ ok: boolean; error?: string }> {
  const expectedPin = process.env.TEACHER_PIN?.trim();
  if (!expectedPin) {
    console.error('TEACHER_PIN 환경 변수가 설정되지 않았습니다 (src/app/teacher/actions.ts).');
    return { ok: false, error: '서버에 교사 PIN이 설정되지 않았습니다. 관리자에게 문의하세요.' };
  }
  if (typeof pin !== 'string') {
    return { ok: false };
  }

  // 길이와 관계없이 일정한 시간에 비교하기 위해 해시끼리 비교합니다.
  const inputHash = createHash('sha256').update(pin).digest();
  const expectedHash = createHash('sha256').update(expectedPin).digest();
  return { ok: timingSafeEqual(inputHash, expectedHash) };
}
