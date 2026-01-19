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

// Tools
const parser = new Parser();

// --- 1. GNews Strategy ---
async function fetchFromGNews(input: FetchNewsInput): Promise<Article[]> {
    // Resilience: Strip quotes and whitespace in case of bad env config
    const apiKey = process.env.GNEWS_API_KEY ? process.env.GNEWS_API_KEY.replace(/['"]/g, '').trim() : '';
    if (!apiKey) throw new Error('GNews API Key missing');

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

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`GNews returned ${response.status}`);
    }

    const data: any = await response.json();
    return (data.articles || [])
        .map((article: any) => ({
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
        }))
        .filter((a: Article) => a.title && a.url);
}

// --- 2. RSS Fallback Strategy ---
async function fetchFromRSS(input: FetchNewsInput): Promise<Article[]> {
    const lang = input.language || 'en';
    const country = (input.country || 'gb').toUpperCase();
    const ceid = `${country}:${lang}`;
    let feedUrl = 'https://news.google.com/rss';

    if (input.query) {
        feedUrl = `${feedUrl}/search?q=${encodeURIComponent(input.query + (input.category ? ` ${input.category}` : ''))}&hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    } else if (input.category) {
        feedUrl = `${feedUrl}/search?q=${encodeURIComponent(input.category)}&hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    } else {
        feedUrl = `${feedUrl}?hl=${lang}-${country}&gl=${country}&ceid=${ceid}`;
    }

    console.log(`[RSS Fallback] Fetching: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    return (feed.items || []).map((item) => {
        // Try to find an image in content or description
        let image = 'https://placehold.co/600x400/e2e8f0/1e293b?text=News';
        const content = item.content || item.contentSnippet || item.description || '';

        // Regex to extract img src
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
            image = imgMatch[1];
        }

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
    }).slice(0, 10);
}

// --- Main Tool ---
const fetchNewsTool = ai.defineTool(
    {
        name: 'fetchNews',
        description: 'Fetches news using GNews with a robust RSS fallback.',
        inputSchema: FetchNewsInputSchema,
        outputSchema: z.array(ArticleSchema),
    },
    async (input) => {
        // Try GNews (Exclusive Mode - RSS Fallback Disabled by User Request)
        console.log('[fetchNews] Attempting GNews...');
        try {
            const articles = await fetchFromGNews(input);
            if (articles.length > 0) {
                console.log(`[fetchNews] GNews returned ${articles.length} articles.`);
                return articles;
            }
            console.log('[fetchNews] GNews returned 0 articles. Switching to RSS.');
            return []; // Return empty instead of falling back
        } catch (e: any) {
            console.warn(`[fetchNews] GNews failed (${e.message}). Switching to RSS.`);
            // Do NOT throw, allow fallback to proceed
        }

        // RSS Fallback - Re-enabled for Robustness
        try {
            const rssArticles = await fetchFromRSS(input);
            console.log(`[fetchNews] RSS returned ${rssArticles.length} articles.`);
            return rssArticles;
        } catch (e) {
            console.error('[fetchNews] Both strategies failed.', e);
            throw new Error('Unable to fetch news from any source.');
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
            return { articles: [], error: e.message || "Unknown error fetching news" };
        }
    }
);

export async function fetchNews(input: FetchNewsInput): Promise<{ articles: Article[], error?: string }> {
    return fetchNewsFlow({ ...input, language: input.language ?? 'en' });
}
