
'use server';
/**
 * @fileOverview AI agent to recommend exercises or tips for 3rd-grade students.
 * - recommendStudentExercise - Function to get an exercise recommendation.
 * - RecommendStudentExerciseOutput - Output type for the recommendation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const RECOMMENDATIONS_DOC_PATH = "appConfig/exerciseRecommendationsDoc";

const RecommendStudentExerciseOutputSchema = z.object({
  recommendationTitle: z.string().describe('제안된 운동의 이름 또는 팁의 제목 (예: "신나는 제자리 뛰기", "스쿼트 자세 바로잡기").'),
  recommendationDetail: z.string().describe('운동 방법 또는 팁에 대한 자세한 설명 (한국어, 초등학교 3학년 대상).'),
});
export type RecommendStudentExerciseOutput = z.infer<typeof RecommendStudentExerciseOutputSchema>;

export async function recommendStudentExercise(): Promise<RecommendStudentExerciseOutput> {
  return recommendStudentExerciseFlow(); 
}

const prompt = ai.definePrompt({
  name: 'recommendStudentExercisePrompt',
  output: {schema: RecommendStudentExerciseOutputSchema},
  prompt: `You are a friendly and encouraging physical education coach for 3rd-grade elementary school students in Korea.
Your task is to provide one exercise recommendation or a helpful tip.
The recommendation should be related to common exercises like squats, planks, walking/running, or jump rope, or general physical activity.
Make it sound fun, engaging, and easy to understand for 3rd graders.
The output must be in Korean.

Provide a "recommendationTitle" (e.g., "깡총깡총 줄넘기 꿀팁!", "바른 자세 플랭크 도전!") and a "recommendationDetail" explaining the exercise or tip.
Focus on simple actions, correct form for injury prevention, or ways to make exercise enjoyable.
Keep the language simple and positive.

Example Output Structure:
{
  "recommendationTitle": "점프! 점프! 제자리 높이뛰기",
  "recommendationDetail": "키가 쑥쑥 크고 싶다면 제자리에서 최대한 높이 점프해보세요! 무릎을 살짝 구부렸다가 힘껏 뛰어오르는 거예요. 바닥에 착지할 때는 사뿐히! 하루 10번씩 도전해볼까요?"
}
`,
});

const recommendStudentExerciseFlow = ai.defineFlow(
  {
    name: 'recommendStudentExerciseFlow',
    outputSchema: RecommendStudentExerciseOutputSchema,
  },
  async () => { 
    try {
      const recommendationsDocRef = doc(db, RECOMMENDATIONS_DOC_PATH);
      const recommendationsDocSnap = await getDoc(recommendationsDocRef);

      if (recommendationsDocSnap.exists()) {
        const data = recommendationsDocSnap.data();
        if (data && data.list && Array.isArray(data.list) && data.list.length > 0) {
          const recommendationsList: RecommendStudentExerciseOutput[] = data.list;
          const randomIndex = Math.floor(Math.random() * recommendationsList.length);
          // Validate the structure of the chosen recommendation
          const chosenRecommendation = recommendationsList[randomIndex];
          if (chosenRecommendation && typeof chosenRecommendation.recommendationTitle === 'string' && typeof chosenRecommendation.recommendationDetail === 'string') {
            return chosenRecommendation;
          }
        }
      }
    } catch (error) {
      console.warn("Error fetching recommendations from Firestore, falling back to AI generation:", error);
      // Fall through to AI generation if Firestore fetch fails or data is invalid
    }
    
    // Fallback to LLM generation if Firestore is empty, document doesn't exist, or chosen item is invalid
    const {output} = await prompt({}); 
    return output!;
  }
);
