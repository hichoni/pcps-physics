
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: '풍풍이의 운동기록장',
  description: '초등학생을 위한 일일 운동 기록 앱입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버 측에서 이 로그가 보인다면 Next.js 앱이 요청을 받기 시작한 것입니다.
  // Cloud Run 로그에서 이 메시지를 확인해보세요.
  console.log('[PhysEd Pal] RootLayout rendering on server at:', new Date().toISOString()); 
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        {/* 페이지가 렌더링되면 이 노란색 박스가 보여야 합니다. */}
        <div 
          data-testid="root-layout-marker" 
          style={{ 
            position: 'fixed', 
            top: '0', 
            left: '0', 
            background: 'yellow', 
            color: 'black', 
            padding: '2px 5px', 
            fontSize: '10px', 
            zIndex: 9999,
            opacity: 0.8
          }}
        >
          RootLayout Rendered OK
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
