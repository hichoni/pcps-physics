import type { Metadata } from 'next';
import { Noto_Sans_KR, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'], // 'korean' subset is often included automatically with Noto Sans KR
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: '풍풍이 운동기록장',
  description: '학생들의 신체 활동 기록 및 관리 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} ${ptSans.variable}`}>
      <head>
        {/* Add any global head tags here, e.g., link rel="icon" */}
      </head>
      <body className="font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
