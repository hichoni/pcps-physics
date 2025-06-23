'use server';
/**
 * @fileOverview An AI agent that suggests the next exercise based on class performance and needs.
 * - suggestNextExercise - A function that suggests the next exercise by analyzing class data.
 * - SuggestNextExerciseInput - The input type for the suggestNextExercise function.
 * - SuggestNextExerciseOutput - The return type for the suggestNextExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Public input schema for the flow
export const SuggestNextExerciseInputSchema = z.object({
  className: z.string().describe("분석할 학급의 이름 (예: '3학년 1반')."),
  students: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe("분석할 학급의 학생 목록."),
  logs: z.array(z.object({
    studentId: z.string(),
    exerciseId: z.string(),
    date: z.string(), // ISO string
  })).describe("최근 활동 기록."),
  exercises: z.array(z.object({
    id: z.string(),
    koreanName: z.string(),
  })).describe("현재 학년에서 가능한 운동 목록."),
});
export type SuggestNextExerciseInput = z.infer<typeof SuggestNextExerciseInputSchema>;

// Internal schema for the prompt
const PromptInputSchema = z.object({
  analysisData: z.string().describe('A JSON string containing class activity data.'),
});

export const SuggestNextExerciseOutputSchema = z.object({
  suggestedExercise: z.string().describe('제안된 운동 또는 활동입니다.'),
  reasoning: z.string().describe('제안된 운동의 근거가 되는 데이터 분석 결과입니다.'),
});
export type SuggestNextExerciseOutput = z.infer<typeof SuggestNextExerciseOutputSchema>;

export async function suggestNextExercise(input: SuggestNextExerciseInput): Promise<SuggestNextExerciseOutput> {
  return suggestNextExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextExercisePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: SuggestNextExerciseOutputSchema},
  prompt: `You are an expert and insightful physical education teacher's assistant for elementary school students in Korea.
Your task is to analyze the provided class activity data and suggest an appropriate next exercise or a class-wide activity.
Your response must be in Korean.

**Analysis Steps:**
1.  **Review Participation:** Look at the total number of logs compared to the number of students. Are most students participating?
2.  **Identify Popular/Unpopular Exercises:** Count how many times each exercise is logged. Which exercises are favorites? Which are being ignored or logged infrequently?
3.  **Find Patterns:** Is there a specific exercise that many students struggle with (inferred from low log counts)? Are there any students who are exceptionally active or inactive compared to their peers?
4.  **Formulate a Suggestion:** Based on your analysis, propose ONE clear, actionable suggestion. This could be:
    - An exercise to strengthen a weak area (e.g., if Plank logs are low, suggest a core exercise).
    - A fun, game-like activity to boost participation.
    - A modified version of a popular exercise to keep it interesting.
    - A challenge related to an unpopular exercise to encourage students to try it.

**Output Requirements:**
-   **suggestedExercise:** The name of the single recommended exercise or activity. (e.g., "코어 힘 기르기 챌린지: '플랭크 오래 버티기'", "다함께 즐기는 '술래잡기 달리기'")
-   **reasoning:** A detailed explanation of your analysis and why you are making this suggestion. Start with a brief summary of the data, then explain the logic behind your recommendation. Be encouraging and use a positive tone suitable for a teacher.

**Data for Analysis:**
Here is the class data in JSON format. The logs represent recent activity.
{{{analysisData}}}

Provide a thoughtful analysis and a practical suggestion.
Your response MUST be a single JSON object matching the output schema.`,
});

const suggestNextExerciseFlow = ai.defineFlow(
  {
    name: 'suggestNextExerciseFlow',
    inputSchema: SuggestNextExerciseInputSchema,
    outputSchema: SuggestNextExerciseOutputSchema,
  },
  async (input) => {
    // Stringify the input to pass it to the prompt
    const analysisData = JSON.stringify(input, null, 2);
    const {output} = await prompt({ analysisData });
    return output!;
  }
);
