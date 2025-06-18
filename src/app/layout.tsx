import type {Metadata} from 'next';
import './globals.css'; // 기본 스타일 유지

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 진단 페이지 V3',
  description: '현재 앱을 진단 중입니다. V3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('[DIAGNOSTIC] RootLayout v3 rendering on server:', new Date().toISOString());
  return (
    <html lang="ko">
      <head>
        {/* Minimal head content */}
      </head>
      <body>
        <div
          data-testid="simplified-root-layout-marker-v3"
          style={{
            position: 'fixed',
            top: '5px',
            left: '5px',
            background: 'orange',
            color: 'black',
            padding: '2px 4px',
            fontSize: '10px',
            zIndex: 10000,
            opacity: 0.85
          }}
        >
          Simplified RootLayout V3 OK
        </div>
        <div style={{ border: '2px dashed darkblue', margin: '25px', padding: '10px', backgroundColor: 'rgba(200,200,255,0.1)' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
