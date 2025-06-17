
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '풍풍이 운동기록장 | 시작하기',
  description: '교사용 또는 학생용 운동기록장으로 이동하세요.',
};

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <School className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline text-primary">
            풍풍이 운동기록장
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            어떤 기록장으로 이동하시겠어요?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 pt-2">
          <Link href="/teacher">
            <Button size="lg" className="w-full py-7 text-xl rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Users className="mr-3 h-6 w-6" />
              교사용 페이지
            </Button>
          </Link>
          <Link href="/student">
            <Button variant="outline" size="lg" className="w-full py-7 text-xl rounded-lg border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground shadow-md hover:shadow-lg transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-6 w-6"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path><path d="M18 20a6 6 0 0 0-12 0Z"></path></svg>
              학생용 페이지
            </Button>
          </Link>
        </CardContent>
      </Card>
      <footer className="text-center p-6 mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} 풍풍이의 운동기록장. 즐거운 체육 시간 되세요!
      </footer>
    </div>
  );
}
