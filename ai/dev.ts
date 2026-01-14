import { config } from 'dotenv';
config();

import '@/ai/flows/smart-post-suppression.ts';
import '@/ai/flows/search-local-directory.ts';
import '@/ai/flows/fetch-news.ts';
import '@/ai/flows/validate-location.ts';
import '@/ai/flows/fetch-cities.ts';
import '@/ai/flows/fetch-city-suggestions.ts';
