
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-exercise.ts';
import '@/ai/flows/recommend-student-exercise.ts';
import '@/ai/flows/generatePersonalizedWelcomeMessage.ts'; // Added new flow
