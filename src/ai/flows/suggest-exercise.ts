
'use server';
/**
 * @fileOverview An AI agent that suggests the next exercise based on class performance and needs.
 * - suggestNextExercise - A function that suggests the next exercise.
 * - SuggestNextExerciseInput - The input type for the suggestNextExercise function.
 * - SuggestNextExerciseOutput - The return type for the suggestNextExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextExerciseInputSchema = z.object({
  classPerformanceSummary: z
    .string()
    .describe('이전 운동에 대한 학급 수행 요약입니다.'),
  studentNeeds: z
    .string()
    .describe('학생들의 특정 필요 또는 개선 영역입니다.'),
});
export type SuggestNextExerciseInput = z.infer<typeof SuggestNextExerciseInputSchema>;

const SuggestNextExerciseOutputSchema = z.object({
  suggestedExercise: z.string().describe('제안된 운동 또는 활동입니다.'),
  reasoning: z.string().describe('제안된 운동의 근거입니다.'),
});
export type SuggestNextExerciseOutput = z.infer<typeof SuggestNextExerciseOutputSchema>;

export async function suggestNextExercise(input: SuggestNextExerciseInput): Promise<SuggestNextExerciseOutput> {
  return suggestNextExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextExercisePrompt',
  input: {schema: SuggestNextExerciseInputSchema},
  output: {schema: SuggestNextExerciseOutputSchema},
  prompt: `You are an experienced physical education teacher for 3rd grade students in Korea. Based on the class's performance and specific needs of students, suggest an appropriate next exercise or activity. The suggestion should be in Korean.

Class Performance Summary: {{{classPerformanceSummary}}}
Student Needs: {{{studentNeeds}}}

Consider exercises that build upon existing skills, address areas needing improvement, and keep the students engaged and motivated. Provide a short reasoning for why you are suggesting this specific exercise. The reasoning should also be in Korean.

Suggest only a single exercise with reasoning. The output should contain suggestedExercise and reasoning, both in Korean.
`,
});

const suggestNextExerciseFlow = ai.defineFlow(
  {
    name: 'suggestNextExerciseFlow',
    inputSchema: SuggestNextExerciseInputSchema,
    outputSchema: SuggestNextExerciseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
