import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, AlertCircle } from "lucide-react";
import { suggestNextExercise, type SuggestNextExerciseInput, type SuggestNextExerciseOutput } from '@/ai/flows/suggest-exercise';
import { useToast } from "@/hooks/use-toast";
import type { RecordedExercise, Student, CustomExercise as CustomExerciseType } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';

interface AiSuggestionBoxProps {
  studentsInClass: Student[];
  logsForClass: RecordedExercise[];
  availableExercises: CustomExerciseType[];
  selectedClass: string | undefined;
}

const AiSuggestionBox: React.FC<AiSuggestionBoxProps> = ({
  studentsInClass,
  logsForClass,
  availableExercises,
  selectedClass,
}) => {
  const [suggestion, setSuggestion] = useState<SuggestNextExerciseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast({
        title: "학급 선택 필요",
        description: "AI 분석을 위해 먼저 학급을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (studentsInClass.length === 0) {
      toast({
        title: "학생 없음",
        description: "선택된 학급에 학생이 없어 분석을 진행할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const recentLogs = logsForClass.filter(log => {
        try {
          return differenceInDays(new Date(), parseISO(log.date)) <= 7;
        } catch {
          return false;
        }
      });

      const input: SuggestNextExerciseInput = {
        className: selectedClass,
        students: studentsInClass.map(s => ({ id: s.id, name: s.name })),
        logs: recentLogs.map(l => ({
          studentId: l.studentId,
          exerciseId: l.exerciseId,
          date: l.date,
        })),
        exercises: availableExercises.map(e => ({ id: e.id, koreanName: e.koreanName })),
      };

      if (input.logs.length === 0) {
        toast({
            title: "데이터 부족",
            description: "최근 7일간의 활동 기록이 없어 분석을 진행할 수 없습니다. 학생들이 활동을 기록하면 제안을 받을 수 있습니다.",
            variant: "default",
            duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      const result = await suggestNextExercise(input);
      setSuggestion(result);
    } catch (error) {
      console.error("AI 제안 가져오기 오류:", error);
      toast({
        title: "AI 제안 오류",
        description: "운동 제안을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-xl">
          <Lightbulb className="h-6 w-6 text-primary" />
          AI 코치
        </CardTitle>
        <CardDescription>
          학급의 최근 7일간 활동 데이터를 AI가 자동으로 분석하여 다음 활동을 제안합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedClass ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 bg-secondary/30 rounded-lg">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>AI 코치 제안을 받으려면 먼저 학급을 선택해주세요.</p>
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading || !selectedClass} className="w-full py-3 text-base rounded-lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-5 w-5" />
            )}
            {isLoading ? '분석 중...' : 'AI 분석 및 제안 받기'}
          </Button>
         )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4">
        {suggestion && (
          <Card className="bg-primary/10 border-primary/30 p-4 rounded-lg w-full">
            <CardTitle className="text-lg mb-2 text-primary font-headline">{suggestion.suggestedExercise}</CardTitle>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{suggestion.reasoning}</p>
          </Card>
        )}
      </CardFooter>
    </Card>
  );
};

export default AiSuggestionBox;
