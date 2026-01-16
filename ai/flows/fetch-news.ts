
'use server';
/**
 * @fileOverview A flow for fetching news articles from the GNews API.
 * 
 * - fetchNews - A function that retrieves news based on a query.
 * - FetchNewsInput - The input type for the fetchNews function.
 * - FetchNewsOutput - The return type for the fetchNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const ArticleSchema = z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
    url: z.string().url(),
    image: z.string().url(),
    publishedAt: z.string(),
    source: z.object({
        name: z.string(),
        url: z.string().url(),
    }),
});
export type Article = z.infer<typeof ArticleSchema>;

const FetchNewsInputSchema = z.object({
    query: z.string().describe('The search query for news articles (e.g., "Nigeria", "London tech").'),
    category: z.string().optional().describe('The category of news (e.g., "general", "business", "technology", "politics").'),
    country: z.string().optional().describe('The 2-letter ISO 3166-1 code of the country (e.g., "gb", "ng").'),
    language: z.string().optional().default('en').describe('The language of the news articles.'),
});
export type FetchNewsInput = z.input<typeof FetchNewsInputSchema>;

const FetchNewsOutputSchema = z.array(ArticleSchema);
export type FetchNewsOutput = z.infer<typeof FetchNewsOutputSchema>;

const fetchNewsFromGNews = ai.defineTool(
    {
        name: 'fetchNewsFromGNews',
        description: 'Fetches news articles from the GNews API.',
        inputSchema: FetchNewsInputSchema,
        outputSchema: FetchNewsOutputSchema,
    },
    async (input) => {
        const apiKey = process.env.GNEWS_API_KEY;
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

        try {
            const response = await fetch(`${url}?${params.toString()}`);
            if (!response.ok) {
                const errorBody = await response.text();
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
            console.error('Error fetching news from GNews API:', error);
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
            console.error("News fetch error:", e);
            return { articles: [], error: e.message || "Unknown error fetching news" };
        }
    }
);

export async function fetchNews(input: FetchNewsInput): Promise<{ articles: Article[], error?: string }> {
    return fetchNewsFlow({ ...input, language: input.language ?? 'en' });
}
