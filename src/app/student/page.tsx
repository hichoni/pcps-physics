
'use client';

import React from 'react';
import StudentHeader from '@/components/StudentHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dumbbell, Target, History, PlusCircle } from 'lucide-react';
import Image from 'next/image';

export default function StudentPage() {
  // For now, student data is not personalized. This can be a future enhancement.
  const studentName = "풍풍이"; // Placeholder name

  return (
    <div className="flex flex-col min-h-screen">
      <StudentHeader studentName={studentName} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <section className="text-center bg-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold font-headline text-primary mb-3">
            {studentName}님, 안녕하세요!
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?
          </p>
          <Button size="lg" className="rounded-lg py-3 px-6 text-lg">
            <PlusCircle className="mr-2 h-6 w-6" />
            새로운 운동 기록하기
          </Button>
        </section>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Target className="mr-3 h-7 w-7 text-accent" />
                나의 운동 목표
              </CardTitle>
              <CardDescription>목표를 설정하고 달성해봐요!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg">
                 <Image src="https://placehold.co/300x200.png" alt="나의 목표 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="goal achievement" />
              </div>
              <Button variant="outline" className="w-full rounded-lg">목표 설정/확인</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <Dumbbell className="mr-3 h-7 w-7 text-primary" />
                추천 운동
              </CardTitle>
              <CardDescription>오늘의 추천 운동을 확인해보세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg">
                <Image src="https://placehold.co/300x200.png" alt="추천 운동 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="exercise stretching" />
              </div>
              <Button variant="outline" className="w-full rounded-lg">추천 운동 보기</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center font-headline text-xl">
                <History className="mr-3 h-7 w-7 text-destructive" />
                나의 활동 내역
              </CardTitle>
              <CardDescription>최근 운동 기록을 살펴봐요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center h-40 bg-secondary/20 rounded-lg">
                 <Image src="https://placehold.co/300x200.png" alt="활동 내역 이미지" width={300} height={200} className="rounded-md object-cover" data-ai-hint="activity log" />
              </div>
              <Button variant="outline" className="w-full rounded-lg">활동 내역 보기</Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} {studentName}의 운동기록장. 매일매일 건강하게!
      </footer>
    </div>
  );
}
