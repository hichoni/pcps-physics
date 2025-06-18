'use client';

import React from 'react';
import type { RecordedExercise, Exercise as ExerciseType, StudentGoal } from '@/lib/types';
import { AlertCircle } from 'lucide-react'; // Keep one Lucide icon for basic import test

// Props are kept to maintain the interface with the parent,
// but the component will render a very simplified output.
interface StudentActivityChartProps {
  logs: RecordedExercise[];
  timeFrame: 'today' | 'week' | 'month';
  studentGoals: StudentGoal;
  availableExercises: ExerciseType[];
}

const StudentActivityChart: React.FC<StudentActivityChartProps> = ({
  availableExercises, // Only using this prop for the minimal check
}) => {
  // Minimal possible JavaScript logic before the return statement.
  const hasExercises = availableExercises && availableExercises.length > 0;

  if (!hasExercises) {
    return (
      <div className="min-h-[150px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg p-4 text-center mt-4">
        <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
        <p>표시할 운동 목록이 없습니다.</p>
        <p className="text-xs">교사 페이지에서 운동을 먼저 설정해주세요.</p>
      </div>
    );
  }

  // If we reach here, it means hasExercises is true.
  // The error reported by Next.js occurs *before* this line if it's a parsing error.
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4" data-testid="activity-chart-minimal">
      <p className="col-span-full text-center p-4 bg-blue-100 rounded-md">
        StudentActivityChart (Minimal Version): 운동 요약이 여기에 표시됩니다.
      </p>
      {availableExercises.map(ex => (
        <div key={ex.id} className="p-3 border rounded-lg bg-slate-50 shadow-sm">
          <p className="font-semibold text-sm text-slate-700">{ex.koreanName}</p>
          <p className="text-xs text-muted-foreground">ID: {ex.id}</p>
        </div>
      ))}
    </div>
  );
};

export default StudentActivityChart;
