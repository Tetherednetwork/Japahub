
'use client';

import { Newspaper, Frown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { fetchNews, type Article, type FetchNewsInput } from '@/ai/flows/fetch-news';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const newsCategories = [
    { value: 'local', label: 'My City' },
    { value: 'nigeria', label: 'Nigeria' },
    { value: 'africa', label: 'Africa' },
    { value: 'politics', label: 'Politics' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
];

function ArticleDetailDialog({ article, isOpen, onOpenChange }: { article: Article | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!article) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{article.title}</DialogTitle>
                    <DialogDescription>
                        From {article.source.name} &bull; {format(parseISO(article.publishedAt), 'PPP')}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                        {article.image && (
                            <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="news article image"
                                />
                            </div>
                        )}
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{article.content}</p>
                    </div>
                </ScrollArea>
                <div className="pt-4">
                    <Button asChild variant="default" className="w-full">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">Read on {article.source.name}</a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ArticleCard({ article, onView }: { article: Article, onView: () => void }) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="relative h-48 w-full bg-muted cursor-pointer" onClick={onView}>
                {article.image ? (
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover"
                        data-ai-hint="news article image"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Newspaper className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
            </div>
            <CardHeader>
                <a onClick={onView} className="cursor-pointer">
                    <CardTitle className="text-lg leading-tight hover:underline">{article.title}</CardTitle>
                </a>
                <CardDescription className="text-xs pt-1">
                    {article.source.name} &bull; {format(parseISO(article.publishedAt), 'MMM d, yyyy')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{article.description}</p>
            </CardContent>
            <CardContent>
                <Button onClick={onView} variant="secondary" className="w-full">
                    Read Full Story
                </Button>
            </CardContent>
        </Card>
    );
}

function NewsSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function NewsPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, `users/${authUser.uid}`) : null, [authUser, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const [activeTab, setActiveTab] = useState(newsCategories[0].value);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleViewArticle = (article: Article) => {
        setSelectedArticle(article);
        setIsDetailOpen(true);
    }

    const memoizedFetchNews = useCallback(async (input: FetchNewsInput) => {
        setIsLoading(true);
        setError(null);
        try {
            const { articles: fetchedArticles, error: fetchError } = await fetchNews(input);
            if (fetchError) {
                setError(fetchError);
                setArticles([]);
            } else {
                setArticles(fetchedArticles);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch news.');
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userProfile?.city && activeTab === 'local') {
            // Wait for profile to load or if tab is local but no city, switch tab
            if (userProfile && !userProfile.city) {
                setActiveTab('nigeria');
            }
            return;
        }

        let input: FetchNewsInput;
        switch (activeTab) {
            case 'local':
                if (!userProfile?.city || !userProfile.country) return;
                input = { query: userProfile.city, country: userProfile.country.toLowerCase() };
                break;
            case 'nigeria':
                input = { query: 'Nigeria', country: 'ng' };
                break;
            case 'africa':
                // GNews doesn't have a continent filter, so we search for the term 'Africa'
                input = { query: 'Africa' };
                break;
            case 'politics':
                input = { query: 'Nigeria OR Africa', category: 'politics' };
                break;
            case 'sports':
                input = { query: 'Nigeria OR Africa', category: 'sports' };
                break;
            case 'entertainment':
                input = { query: 'Nigeria OR Africa', category: 'entertainment' };
                break;
            default:
                input = { query: 'Nigeria', country: 'ng' };
        }
        memoizedFetchNews(input);

    }, [activeTab, memoizedFetchNews, userProfile]);

    const handleTabChange = (value: string) => {
        if (!userProfile?.city && value === 'local') {
            // If user tries to click local tab without a city set, maybe show a toast or just don't switch.
            // For now, we'll just switch to nigeria as a fallback.
            setActiveTab('nigeria');
            return;
        }
        setActiveTab(value);
    }

    return (
        <>
            <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border">
                    <h1 className="text-3xl font-bold">News & Updates</h1>
                    <p className="text-muted-foreground">Stay informed with news from your community and the world.</p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 md:grid-cols-6">
                        {newsCategories.map(cat => (
                            <TabsTrigger key={cat.value} value={cat.value} disabled={!userProfile && cat.value === 'local'}>
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-6">
                        {isLoading && <NewsSkeleton />}

                        {!isLoading && error && (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-destructive/10 text-destructive-foreground rounded-lg border border-destructive">
                                <Frown className="w-12 h-12" />
                                <h2 className="mt-4 text-xl font-semibold">Failed to Load News</h2>
                                <p className="mt-2 text-sm">{error}</p>
                            </div>
                        )}

                        {!isLoading && !error && articles.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
                                <Newspaper className="w-12 h-12 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No Articles Found</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    There are no news articles for this category at the moment.
                                </p>
                            </div>
                        )}

                        {!isLoading && !error && articles.length > 0 && (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {articles.map((article) => (
                                    <ArticleCard key={article.url} article={article} onView={() => handleViewArticle(article)} />
                                ))}
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>
            <ArticleDetailDialog article={selectedArticle} isOpen={isDetailOpen} onOpenChange={setIsDetailOpen} />
        </>
    );
}
