import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lightbulb, AlertTriangle } from "lucide-react";
import { suggestNextExercise, SuggestNextExerciseInput, SuggestNextExerciseOutput } from '@/ai/flows/suggest-exercise';
import { useToast } from "@/hooks/use-toast";

const AiSuggestionBox: React.FC = () => {
  const [classPerformanceSummary, setClassPerformanceSummary] = useState('');
  const [studentNeeds, setStudentNeeds] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestNextExerciseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!classPerformanceSummary.trim() || !studentNeeds.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide both class performance summary and student needs.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const input: SuggestNextExerciseInput = { classPerformanceSummary, studentNeeds };
      const result = await suggestNextExercise(input);
      setSuggestion(result);
    } catch (error) {
      console.error("Error fetching AI suggestion:", error);
      toast({
        title: "AI Suggestion Error",
        description: "Could not fetch exercise suggestion. Please try again.",
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
          AI Exercise Suggestion
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions for the next exercise based on class performance and student needs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="classPerformance" className="block text-sm font-medium mb-1">
            Class Performance Summary
          </label>
          <Textarea
            id="classPerformance"
            value={classPerformanceSummary}
            onChange={(e) => setClassPerformanceSummary(e.target.value)}
            placeholder="e.g., Most students struggled with endurance during the running activity..."
            className="min-h-[100px] rounded-lg text-base"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="studentNeeds" className="block text-sm font-medium mb-1">
            Specific Student Needs
          </label>
          <Textarea
            id="studentNeeds"
            value={studentNeeds}
            onChange={(e) => setStudentNeeds(e.target.value)}
            placeholder="e.g., A few students need to work on their upper body strength..."
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
          Get Suggestion
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
