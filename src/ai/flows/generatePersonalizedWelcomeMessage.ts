
'use server';
/**
 * @fileOverview AI agent to generate a personalized welcome and motivational message for a student.
 * - generatePersonalizedWelcomeMessage - Function to get the personalized message.
 * - GeneratePersonalizedWelcomeMessageInput - Input type for the message generation.
 * - GeneratePersonalizedWelcomeMessageOutput - Output type for the message generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedWelcomeMessageInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  currentLevelName: z.string().describe("The student's current fitness level name (e.g., '움직새싹', '체력 꿈나무')."),
  totalXp: z.number().describe("The student's current total XP (experience points)."),
  currentLevelMaxXp: z.number().describe("The XP threshold for the student's current level to reach the next. Can be Infinity if it's the max level."),
  baseTeacherMessagePart: z.string().describe("A base message provided by the teacher, e.g., '오늘도 즐겁게 운동하고 건강해져요! 어떤 활동을 계획하고 있나요?'"),
});
export type GeneratePersonalizedWelcomeMessageInput = z.infer<typeof GeneratePersonalizedWelcomeMessageInputSchema>;

const GeneratePersonalizedWelcomeMessageOutputSchema = z.object({
  welcomeMessage: z.string().describe('The fully generated personalized welcome and motivational message for the student, in Korean.'),
});
export type GeneratePersonalizedWelcomeMessageOutput = z.infer<typeof GeneratePersonalizedWelcomeMessageOutputSchema>;

export async function generatePersonalizedWelcomeMessage(input: GeneratePersonalizedWelcomeMessageInput): Promise<GeneratePersonalizedWelcomeMessageOutput> {
  return generatePersonalizedWelcomeMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedWelcomeMessagePrompt',
  input: {schema: GeneratePersonalizedWelcomeMessageInputSchema},
  output: {schema: GeneratePersonalizedWelcomeMessageOutputSchema},
  prompt: `You are a super friendly and encouraging PE coach for elementary school students in Korea.
Your task is to generate a personalized welcome and motivational message.
The message MUST be in Korean and include fun, age-appropriate emojis.
Crucially, you MUST wrap the student's level name in <level> tags. For example: <level>체력 꿈나무</level>.

Student Information:
- Name: {{{studentName}}}
- Current Level: {{{currentLevelName}}}
- Current XP: {{{totalXp}}}
- XP needed for next level (this is the upper bound of their current level, Infinity if max level): {{{currentLevelMaxXp}}}
- Base message from teacher: "{{{baseTeacherMessagePart}}}"

Message Structure:
1. Greet the student: "{{{studentName}}}님, 안녕하세요! 👋"
2. Incorporate the teacher's base message: "{{{baseTeacherMessagePart}}}" (Make it flow naturally after the greeting).
3. Add a personalized motivational sentence based on their level progress:
    - If \`currentLevelMaxXp\` is Infinity (they are max level): Congratulate them on being "{{{currentLevelName}}}" and encourage continued healthy habits. Example: "최고 등급인 <level>{{{currentLevelName}}}</level>이시군요! 정말 대단해요! 👑 앞으로도 꾸준히 건강을 잘 챙기는 어린이가 되어요! ✨"
    - Else (not max level):
        - Calculate points needed: \`pointsToNext = currentLevelMaxXp - totalXp\`.
        - If \`pointsToNext <= 0\` (very close or just leveled up): "현재 <level>{{{currentLevelName}}}</level> 등급에서 정말 잘하고 있어요! 다음 레벨이 바로 코앞이니 조금만 더 힘내세요! 🔥"
        - Else if \`pointsToNext <= 20\`: "현재 <level>{{{currentLevelName}}}</level> 등급이시네요. 앞으로 딱 {{{pointsToNext}}} XP만 더 모으면 다음 레벨로 올라갈 수 있어요! 거의 다 왔으니 포기하지 마세요! 🚀"
        - Else (more XP needed): "현재 <level>{{{currentLevelName}}}</level> 등급이시군요! 매일 운동 목표를 꾸준히 달성하고 XP를 모아서 다음 레벨에도 도전해보세요! 할 수 있어요! 💪"

Keep the overall tone very positive, enthusiastic, and age-appropriate for an elementary school student.
The final output should be a single JSON object matching the output schema, containing one field "welcomeMessage".
Example for a student named '슬기' at '체력 꿈나무' (450XP, next level at 600XP), teacher base message "오늘도 신나게 운동해볼까요?":
{
  "welcomeMessage": "슬기님, 안녕하세요! 👋 오늘도 신나게 운동해볼까요? 현재 <level>체력 꿈나무</level> 등급이시군요! 매일 운동 목표를 꾸준히 달성하고 XP를 모아서 다음 레벨에도 도전해보세요! 할 수 있어요! 💪"
}
Example for a student named '민준' at '전설의 운동왕' (2000XP, max level), teacher base message "오늘 운동 계획은 뭐예요?":
{
  "welcomeMessage": "민준님, 안녕하세요! 👋 오늘 운동 계획은 뭐예요? 최고 등급인 <level>전설의 운동왕</level>이시군요! 정말 대단해요! 👑 앞으로도 꾸준히 건강을 잘 챙기는 어린이가 되어요! ✨"
}
`,
});

const generatePersonalizedWelcomeMessageFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedWelcomeMessageFlow',
    inputSchema: GeneratePersonalizedWelcomeMessageInputSchema,
    outputSchema: GeneratePersonalizedWelcomeMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
