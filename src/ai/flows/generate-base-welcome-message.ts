
'use server';
/**
 * @fileOverview AI agent to generate a generic, encouraging welcome message for students.
 * - generateBaseWelcomeMessage - Function to get a new welcome message.
 * - GenerateBaseWelcomeMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBaseWelcomeMessageOutputSchema = z.object({
  message: z.string().describe('A short, friendly, and encouraging welcome message for elementary school students, in Korean. It should include fun emojis.'),
});
export type GenerateBaseWelcomeMessageOutput = z.infer<typeof GenerateBaseWelcomeMessageOutputSchema>;


export async function generateBaseWelcomeMessage(): Promise<GenerateBaseWelcomeMessageOutput> {
  return await generateBaseWelcomeMessageFlow();
}

const prompt = ai.definePrompt({
  name: 'generateBaseWelcomeMessagePrompt',
  output: {schema: GenerateBaseWelcomeMessageOutputSchema},
  prompt: `You are a creative and friendly PE teacher's assistant for elementary school students in Korea.
Your task is to generate a short, friendly, and encouraging welcome message for elementary school students in Korea.
The message should be varied and use fun, age-appropriate emojis.
It should be a general message that can be shown to any student.
The message MUST be in Korean.
The message should ask a question to encourage engagement.

Here are some examples of the kind of message to generate:
- "오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요? 💪"
- "활기찬 하루를 시작해볼까요? 오늘은 어떤 운동으로 에너지를 충전할 건가요? 🚀"
- "풍풍이와 함께 신나는 운동 시간! 오늘은 어떤 목표에 도전해볼래요? ✨"
- "몸도 마음도 쑥쑥! 오늘은 어떤 재미있는 운동을 할지 궁금하네요! 😄"

Generate a new, creative message that is different from the examples but has a similar tone.
The final output should be a single JSON object matching the output schema.
`,
});

const generateBaseWelcomeMessageFlow = ai.defineFlow(
  {
    name: 'generateBaseWelcomeMessageFlow',
    outputSchema: GenerateBaseWelcomeMessageOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
