import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lightbulb } from "lucide-react";
import { suggestNextExercise, SuggestNextExerciseInput, SuggestNextExerciseOutput } from '@/ai/flows/suggest-exercise';
import { useToast } from "@/hooks/use-toast";
import type { RecordedExercise } from '@/lib/types'; // Import RecordedExercise

interface AiSuggestionBoxProps {
  recordedExercises: RecordedExercise[]; // Add this prop
}

const AiSuggestionBox: React.FC<AiSuggestionBoxProps> = ({ recordedExercises }) => {
  const [classPerformanceSummary, setClassPerformanceSummary] = useState('');
  const [studentNeeds, setStudentNeeds] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestNextExerciseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!classPerformanceSummary.trim() || !studentNeeds.trim()) {
      toast({
        title: "입력 필요",
        description: "학급 수행 요약과 학생 필요 사항을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      // You could potentially use recordedExercises here to automatically generate
      // parts of classPerformanceSummary or studentNeeds in a more advanced version.
      // For now, we rely on manual input.
      const input: SuggestNextExerciseInput = { classPerformanceSummary, studentNeeds };
      const result = await suggestNextExercise(input);
      setSuggestion(result);
    } catch (error) {
      console.error("AI 제안 가져오기 오류:", error);
      toast({
        title: "AI 제안 오류",
        description: "운동 제안을 가져올 수 없습니다. 다시 시도해주세요.",
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
          AI 운동 제안
        </CardTitle>
        <CardDescription>
          학급 수행 및 학생 필요에 따라 AI 기반 다음 운동 제안을 받아보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="classPerformance" className="block text-sm font-medium mb-1">
            학급 수행 요약
          </label>
          <Textarea
            id="classPerformance"
            value={classPerformanceSummary}
            onChange={(e) => setClassPerformanceSummary(e.target.value)}
            placeholder="예: 대부분의 학생들이 달리기 활동 중 지구력에 어려움을 겪었습니다..."
            className="min-h-[100px] rounded-lg text-base"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="studentNeeds" className="block text-sm font-medium mb-1">
            특정 학생 필요 사항
          </label>
          <Textarea
            id="studentNeeds"
            value={studentNeeds}
            onChange={(e) => setStudentNeeds(e.target.value)}
            placeholder="예: 몇몇 학생들은 상체 근력을 키울 필요가 있습니다..."
            className="min-h-[100px] rounded-lg text-base"
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4">
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full py-3 text-base rounded-lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-5 w-5" />
          )}
          제안 받기
        </Button>
        {suggestion && (
          <Card className="bg-primary/10 border-primary/30 p-4 rounded-lg">
            <CardTitle className="text-lg mb-2 text-primary font-headline">{suggestion.suggestedExercise}</CardTitle>
            <p className="text-sm text-foreground/80">{suggestion.reasoning}</p>
          </Card>
        )}
      </CardFooter>
    </Card>
  );
};

export default AiSuggestionBox;
