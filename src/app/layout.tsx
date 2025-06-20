
import type { Metadata } from 'next';
import { Noto_Sans_KR, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'], 
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const APP_VERSION = "1.0.1"; // PWA 캐시 무효화를 위한 버전

export const metadata: Metadata = {
  title: '풍풍이 운동기록장',
  description: '학생들의 신체 활동 기록 및 관리 플랫폼',
  manifest: `/manifest.json?v=${APP_VERSION}`, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} ${ptSans.variable}`}>
      <head>
        <meta name="application-name" content="풍풍이 운동기록장" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="풍풍이 운동기록장" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3B82F6" /> 
        <link rel="apple-touch-icon" href="https://placehold.co/180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://placehold.co/32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://placehold.co/16x16.png" />
        <link rel="shortcut icon" href="https://placehold.co/48x48.png" />
      </head>
      <body className="font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
