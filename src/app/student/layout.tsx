
import type {Metadata} from 'next';
import '../globals.css'; // Ensure globals.css is imported from the correct relative path

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
    <>
      {/*
        The <head> content like fonts is now managed by the RootLayout (src/app/layout.tsx)
        or by Next.js's built-in <Head> component if needed for page-specific head tags within pages.
        The <body> tag is also rendered by the RootLayout.
        Toaster is also handled by RootLayout.
        StudentLayout should only provide the content that goes *inside* the body.
      */}
      {children}
    </>
  );
}

    