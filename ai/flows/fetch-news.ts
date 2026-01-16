'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Parser from 'rss-parser';

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

const parser = new Parser();

// Helper to get Google New RSS URL
function getGoogleNewsRssUrl(input: FetchNewsInput): string {
    const lang = input.language || 'en';
    const country = (input.country || 'gb').toUpperCase(); // Default to UK if not specified? Or US.
    const ceid = `${country}:${lang}`;

    let baseUrl = 'https://news.google.com/rss';

    if (input.query) {
        // Search query
        return `${baseUrl}/search?q=${encodeURIComponent(input.query + (input.category ? ` ${input.category}` : ''))}&hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    } else if (input.category) {
        // Topic (Note: Google News usage of topics in RSS is non-standard, better to search)
        // Mapping common categories to search terms often works better reliably
        return `${baseUrl}/search?q=${encodeURIComponent(input.category)}&hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    } else {
        // Top headlines for country
        return `${baseUrl}?hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    }
}

const fetchNewsTool = ai.defineTool(
    {
        name: 'fetchNews',
        description: 'Fetches news articles from Google News RSS feeds. Reliable and free.',
        inputSchema: FetchNewsInputSchema,
        outputSchema: z.array(ArticleSchema),
    },
    async (input) => {
        try {
            const feedUrl = getGoogleNewsRssUrl(input);
            console.log(`Fetching RSS from: ${feedUrl}`);

            const feed = await parser.parseURL(feedUrl);

            if (!feed.items || feed.items.length === 0) {
                return [];
            }

            return feed.items.map((item) => {
                // RSS items often don't have images directly in standard fields, 
                // but we can try to extract or use a placeholder.
                // Google News RSS description often contains HTMLTables.

                // Use a generic placeholder if we can't find one.
                const image = 'https://placehold.co/600x400/e2e8f0/1e293b?text=News';

                return {
                    title: item.title || 'Untitled',
                    description: item.contentSnippet || item.content || '',
                    content: item.content || item.contentSnippet || '',
                    url: item.link || '',
                    image: image,
                    publishedAt: item.isoDate || new Date().toISOString(),
                    source: {
                        name: item.source || 'Google News',
                        url: item.link || '',
                    }
                };
            }).slice(0, 10); // Limit to 10 items

        } catch (error) {
            console.error("RSS Fetch Error:", error);
            throw new Error(`Failed to fetch news feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            const articles = await fetchNewsTool(input);
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
