
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 | 진단 V3',
  description: '진단용 기본 페이지 V3입니다.',
};

export default function WelcomePageV3() {
  console.log('[DIAGNOSTIC] WelcomePage v3 rendering on server:', new Date().toISOString());
  return (
    <div style={{ padding: '15px', backgroundColor: '#e0ffe0', minHeight: 'calc(100vh - 50px)' }}>
      <div style={{ backgroundColor: 'lightgreen', padding: '8px', border: '1px solid darkgreen', marginBottom: '8px', fontSize: '12px' }}>
        Page.tsx V3 Rendered OK
      </div>
      <h1 style={{color: 'green'}}>풍풍이 운동기록장 - 진단 페이지 V3</h1>
      <p>이 페이지가 보인다면 Next.js 앱이 루트 경로에서 이 기본 페이지를 렌더링하고 있는 것입니다.</p>
      <p>현재 서버 시간 (렌더링 시점): {new Date().toLocaleTimeString()}</p>
      <a href="/teacher" style={{ marginRight: '10px', color: 'darkblue' }}>교사용 페이지로 이동 (테스트)</a>
      <a href="/student" style={{ color: 'darkblue' }}>학생용 페이지로 이동 (테스트)</a>
    </div>
  );
}
