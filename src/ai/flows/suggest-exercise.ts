// src/ai/flows/suggest-exercise.ts
'use server';
/**
 * @fileOverview An AI agent that suggests the next exercise based on class performance and needs.
 *
 * - suggestNextExercise - A function that suggests the next exercise.
 * - SuggestNextExerciseInput - The input type for the suggestNextExercise function.
 * - SuggestNextExerciseOutput - The return type for the suggestNextExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextExerciseInputSchema = z.object({
  classPerformanceSummary: z
    .string()
    .describe('A summary of the class performance in the previous exercises.'),
  studentNeeds: z
    .string()
    .describe('Specific needs or areas of improvement for the students.'),
});
export type SuggestNextExerciseInput = z.infer<typeof SuggestNextExerciseInputSchema>;

const SuggestNextExerciseOutputSchema = z.object({
  suggestedExercise: z.string().describe('The suggested exercise or activity.'),
  reasoning: z.string().describe('The reasoning behind the suggested exercise.'),
});
export type SuggestNextExerciseOutput = z.infer<typeof SuggestNextExerciseOutputSchema>;

export async function suggestNextExercise(input: SuggestNextExerciseInput): Promise<SuggestNextExerciseOutput> {
  return suggestNextExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextExercisePrompt',
  input: {schema: SuggestNextExerciseInputSchema},
  output: {schema: SuggestNextExerciseOutputSchema},
  prompt: `You are an experienced physical education teacher for 3rd grade students. Based on the class's performance and specific needs of students, suggest an appropriate next exercise or activity.

Class Performance Summary: {{{classPerformanceSummary}}}
Student Needs: {{{studentNeeds}}}

Consider exercises that build upon existing skills, address areas needing improvement, and keep the students engaged and motivated. Provide a short reasoning for why you are suggesting this specific exercise.

Suggest only a single exercise with reasoning.  The output should contain suggestedExercise and reasoning.
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
