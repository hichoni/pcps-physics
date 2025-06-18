
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 | 시작하기',
  description: '교사용 또는 학생용 운동기록장으로 이동하세요.',
};

export default function WelcomePage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'lightgreen', padding: '10px', border: '1px solid green', marginBottom: '10px' }}>
        Page.tsx Rendered OK
      </div>
      <h1>풍풍이 운동기록장 테스트 페이지</h1>
      <p>이 페이지가 보인다면 Next.js 앱이 루트 경로에서 기본 페이지를 렌더링하고 있는 것입니다.</p>
      <p>현재 시간: <span id="client-time">브라우저 시간 로딩 중...</span></p>
      <a href="/teacher" style={{ marginRight: '10px', color: 'blue' }}>교사용 페이지로 이동</a>
      <a href="/student" style={{ color: 'blue' }}>학생용 페이지로 이동</a>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              document.getElementById('client-time').innerText = new Date().toLocaleTimeString();
              console.log('[PhysEd Pal] page.tsx client-side script executed.');
            });
          `,
        }}
      />
    </div>
  );
}
