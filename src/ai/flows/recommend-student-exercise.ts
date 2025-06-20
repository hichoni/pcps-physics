
'use server';
/**
 * @fileOverview AI agent to recommend personalized exercises or tips for elementary school students.
 * - recommendStudentExercise - Function to get a personalized exercise recommendation.
 * - RecommendStudentExerciseInput - Input type for the recommendation.
 * - RecommendStudentExerciseOutput - Output type for the recommendation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { StudentGoal } from '@/lib/types'; // Assuming StudentGoal is defined in types

const RecommendStudentExerciseInputSchema = z.object({
  studentGrade: z.string().describe('학생의 학년 (예: "1학년", "3학년", "6학년", "초등학생 전반").'),
  studentGender: z.enum(['male', 'female']).describe('학생의 성별.'),
  studentLevelName: z.string().describe('학생의 현재 운동 레벨 이름 (예: "움직새싹", "체력 꿈나무").'),
  studentXp: z.number().optional().describe('학생의 현재 총 XP (경험치).'),
  recentActivitySummary: z.string().optional().describe('최근 운동 수행 요약 또는 특정 필요 영역 (예: "스쿼트 자세 교정 필요", "줄넘기 목표 꾸준히 달성 중").'),
  exerciseGoals: z.custom<StudentGoal>().optional().describe('학생의 현재 운동 목표 객체. key는 운동 ID, value는 목표량.'),
});
export type RecommendStudentExerciseInput = z.infer<typeof RecommendStudentExerciseInputSchema>;

const RecommendStudentExerciseOutputSchema = z.object({
  recommendationTitle: z.string().describe('제안된 운동의 이름 또는 팁의 제목 (예: "신나는 제자리 뛰기", "스쿼트 자세 바로잡기").'),
  recommendationDetail: z.string().describe('운동 방법 또는 팁에 대한 자세한 설명 (한국어, 초등학생 대상).'),
  reasoning: z.string().optional().describe('이 추천을 하는 간략한 이유 (왜 이 학생에게 이 추천이 적절한지).'),
});
export type RecommendStudentExerciseOutput = z.infer<typeof RecommendStudentExerciseOutputSchema>;

export async function recommendStudentExercise(input: RecommendStudentExerciseInput): Promise<RecommendStudentExerciseOutput> {
  return recommendStudentExerciseFlow(input); 
}

// Define a specific input schema for the prompt
const PromptInputSchema = z.object({
    studentGrade: z.string().describe('학생의 학년 (예: "1학년", "3학년", "6학년", "초등학생 전반").'),
    studentGender: z.enum(['male', 'female']).describe('학생의 성별.'),
    studentLevelName: z.string().describe('학생의 현재 운동 레벨 이름 (예: "움직새싹", "체력 꿈나무").'),
    studentXp: z.number().optional().describe('학생의 현재 총 XP (경험치).'),
    recentActivitySummary: z.string().optional().describe('최근 운동 수행 요약 또는 특정 필요 영역 (예: "스쿼트 자세 교정 필요", "줄넘기 목표 꾸준히 달성 중").'),
    exerciseGoalsString: z.string().optional().describe('학생의 현재 운동 목표 객체의 JSON 문자열 표현.'),
});

const prompt = ai.definePrompt({
  name: 'recommendStudentExercisePrompt',
  input: {schema: PromptInputSchema}, // Use the new prompt-specific input schema
  output: {schema: RecommendStudentExerciseOutputSchema},
  prompt: `You are a friendly, encouraging, and expert physical education coach for elementary school students in Korea.
Your task is to provide ONE personalized exercise recommendation or a helpful tip based on the student's information.
The recommendation should be related to common exercises like squats, planks, walking/running, or jump rope, or general physical activity and healthy habits.
Make it sound fun, engaging, and easy to understand for the student's grade level.
The output must be in Korean.

Student Information:
- Grade: {{{studentGrade}}}
- Gender: {{{studentGender}}}
- Current Level: {{{studentLevelName}}}
{{#if studentXp}}
- Current XP: {{{studentXp}}}
{{/if}}
{{#if recentActivitySummary}}
- Recent Activity/Needs: {{{recentActivitySummary}}}
{{/if}}
{{#if exerciseGoalsString}}
- Current Goals: {{{exerciseGoalsString}}}
{{/if}}

Consider the following when generating the recommendation:
- **Grade Level:**
  - Lower grades (1-2학년): Focus on play-based activities, fun movements, simple instructions.
  - Middle grades (3-4학년): Introduce more structured exercises, basic form correction, simple challenges.
  - Upper grades (5-6학년): Suggest more advanced variations, endurance building, specific skill tips, goal-oriented advice.
- **Gender:** While many activities are universal, you can subtly tailor suggestions if appropriate (e.g., focusing on different muscle groups or common interests, but avoid stereotypes).
- **Level & XP:** Higher levels/XP might indicate more experience, so you can suggest slightly more challenging or nuanced tips. Lower levels might need more foundational advice.
- **Recent Activity/Needs:** If provided, directly address these. For example, if "squat form needs correction" is a need, provide a tip for squat form. If "running endurance low", suggest a tip for improving it.
- **Goals:** If goals are provided, offer tips that help achieve them or suggest complementary activities.

Generate a "recommendationTitle" (e.g., "깡총깡총 줄넘기 꿀팁!", "튼튼 다리 만들기 스쿼트 도전!", "올바른 달리기 자세로 운동왕 되기!").
Generate a "recommendationDetail" explaining the exercise or tip clearly for the student's grade.
If possible, provide a brief "reasoning" (1-2 sentences) explaining why this tip is good for this student, considering their information.

Example Output Structure:
{
  "recommendationTitle": "점프! 점프! 제자리 높이뛰기 (1학년 맞춤)",
  "recommendationDetail": "키가 쑥쑥 크고 싶다면 제자리에서 최대한 높이 점프해보세요! 무릎을 살짝 구부렸다가 힘껏 뛰어오르는 거예요. 바닥에 착지할 때는 사뿐히! 하루 10번씩 도전해볼까요?",
  "reasoning": "1학년 친구들이 재미있게 점프 연습을 하며 성장판을 자극하고 다리 힘을 기를 수 있어요."
}

Aim for a wide variety of recommendations. If you were to be called many times for different students of the same grade, you should be able to provide at least 10 distinct types of advice or exercises for that grade over time.
Your response should be a single, well-formed JSON object matching the output schema.
Focus on simple actions, correct form for injury prevention, or ways to make exercise enjoyable.
Keep the language simple, positive, and encouraging.
Output must be in Korean.
`,
});

const recommendStudentExerciseFlow = ai.defineFlow(
  {
    name: 'recommendStudentExerciseFlow',
    inputSchema: RecommendStudentExerciseInputSchema, // External input schema for the flow
    outputSchema: RecommendStudentExerciseOutputSchema,
  },
  async (input) => { 
    const { studentGrade, studentGender, studentLevelName, studentXp, recentActivitySummary, exerciseGoals } = input;
    
    const promptInputData = {
        studentGrade,
        studentGender,
        studentLevelName,
        studentXp,
        recentActivitySummary,
        exerciseGoalsString: exerciseGoals ? JSON.stringify(exerciseGoals, null, 2) : undefined,
    };

    const {output} = await prompt(promptInputData); 
    return output!;
  }
);

