'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// import fetch from 'node-fetch'; // Removed to use native global fetch

// Define schemas
const FetchNewsInputSchema = z.object({
    query: z.string().optional().describe('A keyword or topic to search for (e.g., "technology", "finance").'),
    country: z.string().optional().describe('The 2-letter country code to focus on (e.g., "us", "ng", "gb").'),
    category: z.string().optional().describe('The category of news (e.g., "business", "technology", "sports").'),
    language: z.string().optional().describe('The language of the news (e.g., "en", "fr").'),
});

export type FetchNewsInput = z.infer<typeof FetchNewsInputSchema>;

const ArticleSchema = z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
    url: z.string(),
    image: z.string(),
    publishedAt: z.string(),
    source: z.object({
        name: z.string(),
        url: z.string(),
    })
});

export type Article = z.infer<typeof ArticleSchema>;

const FetchNewsOutputSchema = z.array(ArticleSchema);
export type FetchNewsOutput = z.infer<typeof FetchNewsOutputSchema>;


const fetchNewsFromGNews = ai.defineTool(
    {
        name: 'fetchNewsFromGNews',
        description: 'Fetches top headlines or searches for news articles using the GNews API.',
        inputSchema: FetchNewsInputSchema,
        outputSchema: FetchNewsOutputSchema,
    },
    async (input) => {
        const apiKey = process.env.GNEWS_API_KEY;
        console.log(`[fetchNews] Using API Key (length): ${apiKey ? apiKey.length : 0}`);

        if (!apiKey) {
            console.error('GNEWS_API_KEY environment variable not set.');
            throw new Error('GNews API Key is missing on server.');
        }

        const url = 'https://gnews.io/api/v4/top-headlines';
        const params = new URLSearchParams({
            apikey: apiKey,
            lang: input.language || 'en',
        });

        if (input.query) params.append('q', input.query);
        if (input.country) params.append('country', input.country);
        if (input.category && ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health', 'politics'].includes(input.category)) {
            params.append('topic', input.category);
        }

        const requestUrl = `${url}?${params.toString()}`;
        console.log(`[fetchNews] Requesting URL (sans key): ${requestUrl.replace(apiKey, 'REDACTED')}`);

        try {
            const response = await fetch(requestUrl);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[fetchNews] API Error ${response.status}: ${errorBody}`);
                throw new Error(`GNews API Error (${response.status}): ${errorBody}`);
            }

            const data: any = await response.json();

            // Filter and map articles
            const validArticles = (data.articles || [])
                .map((article: any) => {
                    return {
                        title: article.title,
                        description: article.description || '',
                        content: article.content || '',
                        url: article.url,
                        image: article.image || '',
                        publishedAt: article.publishedAt,
                        source: {
                            name: article.source.name,
                            url: article.source.url,
                        }
                    };
                })
                .filter((article: any) => article.title && article.url);

            return validArticles;

        } catch (error) {
            console.error('[fetchNews] Network/Code Error:', error);
            throw error;
        }
    }
);

const fetchNewsFlow = ai.defineFlow(
    {
        name: 'fetchNewsFlow',
        inputSchema: FetchNewsInputSchema,
        outputSchema: z.object({
            articles: z.array(ArticleSchema),
            error: z.string().optional()
        }),
    },
    async (input) => {
        try {
            const articles = await fetchNewsFromGNews(input);
            return { articles };
        } catch (e: any) {
            console.error("News fetch flow error:", e);
            return { articles: [], error: e.message || "Unknown error fetching news" };
        }
    }
);

export async function fetchNews(input: FetchNewsInput): Promise<{ articles: Article[], error?: string }> {
    return fetchNewsFlow({ ...input, language: input.language ?? 'en' });
}
