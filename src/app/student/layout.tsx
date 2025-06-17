
import type {Metadata} from 'next';
import '../globals.css'; // Ensure globals.css is imported from the correct relative path
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: '나의 운동 기록장 - 풍풍이',
  description: '나의 운동 목표를 설정하고 활동을 기록해요!',
};

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
