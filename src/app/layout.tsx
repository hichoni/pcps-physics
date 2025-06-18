import type {Metadata} from 'next';
import './globals.css'; // 기본 스타일 유지

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 진단 페이지', // 단순화된 제목
  description: '현재 앱을 진단 중입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버 측 Cloud Run 로그에서 이 메시지를 확인합니다.
  console.log('[PhysEd Pal] SIMPLIFIED RootLayout rendering on server at:', new Date().toISOString());
  return (
    <html lang="ko">
      <head>
        {/* <title>진단 페이지</title>  Metadata의 title이 사용됩니다. */}
      </head>
      <body>
        <div
          data-testid="simplified-root-layout-marker"
          style={{
            position: 'fixed',
            top: '10px', // 이전 진단 마커와 겹치지 않도록 위치 약간 조정
            left: '10px',
            background: 'orange', // 색상 변경으로 구분
            color: 'black',
            padding: '3px 6px',
            fontSize: '11px',
            zIndex: 9999,
            opacity: 0.9
          }}
        >
          Simplified RootLayout OK
        </div>
        {/* children을 감싸는 div를 추가하여 page.tsx 내용이 확실히 보이도록 함 */}
        <div style={{ border: '3px dashed blue', margin: '30px', padding: '15px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
