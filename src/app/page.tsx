import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 | 시작하기',
  description: '풍풍이 운동기록장 시작 페이지입니다. 교사 또는 학생으로 접속하세요.',
};

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
          풍풍이 운동기록장
        </h1>
        <p className="text-xl text-muted-foreground">
          즐겁고 건강한 학교생활, 풍풍이와 함께!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
        <Link href="/teacher">
          <Button size="lg" className="w-full py-8 text-xl rounded-xl shadow-lg hover:scale-105 transition-transform duration-200">
            선생님으로 시작하기
          </Button>
        </Link>
        <Link href="/student">
          <Button variant="secondary" size="lg" className="w-full py-8 text-xl rounded-xl shadow-lg hover:scale-105 transition-transform duration-200">
            학생으로 시작하기
          </Button>
        </Link>
      </div>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PhysEd Pal. All rights reserved.
      </footer>
    </div>
  );
}
