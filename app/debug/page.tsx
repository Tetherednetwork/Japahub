'use server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Globe, Shield, Activity } from 'lucide-react';
import React from 'react';

// Server Action to perform checks
async function performDiagnostics() {
    const results = {
        env: {
            gnews: !!process.env.GNEWS_API_KEY,
            gnews_len: process.env.GNEWS_API_KEY ? process.env.GNEWS_API_KEY.length : 0,
            gnews_preview: process.env.GNEWS_API_KEY ? `${process.env.GNEWS_API_KEY.substring(0, 3)}...${process.env.GNEWS_API_KEY.substring(process.env.GNEWS_API_KEY.length - 3)}` : 'N/A',
            gnews_quoted: process.env.GNEWS_API_KEY ? (process.env.GNEWS_API_KEY.startsWith('"') || process.env.GNEWS_API_KEY.endsWith('"')) : false,
            places: !!process.env.GOOGLE_PLACES_API_KEY,
            places_len: process.env.GOOGLE_PLACES_API_KEY ? process.env.GOOGLE_PLACES_API_KEY.length : 0,
        },
        connectivity: {
            google: { status: 'pending', code: 0, time: 0 },
            nominatim: { status: 'pending', code: 0, time: 0 },
            gnews_rss: { status: 'pending', code: 0, time: 0 },
            gnews_api: { status: 'pending', code: 0, time: 0 },
        }
    };

    // Check Google Connectivity
    try {
        const start = Date.now();
        const res = await fetch('https://www.google.com', { method: 'HEAD' });
        results.connectivity.google = { status: res.ok ? 'ok' : 'error', code: res.status, time: Date.now() - start };
    } catch (e: any) {
        results.connectivity.google = { status: 'failed', code: 0, time: 0 };
    }

    // Check Nominatim Connectivity
    try {
        const start = Date.now();
        const res = await fetch('https://nominatim.openstreetmap.org/search?q=London&format=json', {
            method: 'GET',
            headers: { 'User-Agent': 'JapaHub-Debug/1.0' }
        });
        results.connectivity.nominatim = { status: res.ok ? 'ok' : 'error', code: res.status, time: Date.now() - start };
    } catch (e: any) {
        results.connectivity.nominatim = { status: 'failed', code: 0, time: 0 };
    }

    // Check GNews RSS Connectivity
    try {
        const start = Date.now();
        const res = await fetch('https://news.google.com/rss', { method: 'HEAD' });
        results.connectivity.gnews_rss = { status: res.ok ? 'ok' : 'error', code: res.status, time: Date.now() - start };
    } catch (e: any) {
        results.connectivity.gnews_rss = { status: 'failed', code: 0, time: 0 };
    }

    // Check GNews API (Real Test)
    try {
        const start = Date.now();
        const apiKey = process.env.GNEWS_API_KEY;
        if (apiKey) {
            const res = await fetch(`https://gnews.io/api/v4/top-headlines?apikey=${apiKey}&lang=en&max=1`, { method: 'GET' });
            results.connectivity.gnews_api = { status: res.ok ? 'ok' : 'error', code: res.status, time: Date.now() - start };
        } else {
            results.connectivity.gnews_api = { status: 'missing_key', code: 0, time: 0 };
        }
    } catch (e: any) {
        results.connectivity.gnews_api = { status: 'failed', code: 0, time: 0 };
    }

    return results;
}

export default async function DebugPage() {
    const data = await performDiagnostics();

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Diagnostics <Badge variant="outline" className="ml-2 text-lg">v2.0-GNEWS-TEST</Badge></h1>
                    <p className="text-muted-foreground">Server-side environment and connectivity checks.</p>
                </div>
                <Badge variant={data.env.gnews && data.env.places ? 'default' : 'destructive'}>
                    {data.env.gnews && data.env.places ? 'Configured' : 'Missing Config'}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Environment Variables</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">GNEWS_API_KEY</span>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-muted px-1 rounded">{data.env.gnews_preview}</span>
                                    {data.env.gnews ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                </div>
                                {data.env.gnews_quoted && <span className="text-xs text-red-500 font-bold">WARNING: Remove quotes!</span>}
                                {data.env.gnews_len > 0 && data.env.gnews_len !== 32 && <span className="text-xs text-yellow-500">Length Warn: {data.env.gnews_len} (Exp: ~32)</span>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">GOOGLE_PLACES_API_KEY</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Len: {data.env.places_len}</span>
                                {data.env.places ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Network Connectivity (Server)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> Google (www.google.com)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{data.connectivity.google.time}ms</span>
                                <Badge variant={data.connectivity.google.status === 'ok' ? 'outline' : 'destructive'}>{data.connectivity.google.status.toUpperCase()} ({data.connectivity.google.code})</Badge>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> Nominatim (OSM)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{data.connectivity.nominatim.time}ms</span>
                                <Badge variant={data.connectivity.nominatim.status === 'ok' ? 'outline' : 'destructive'}>{data.connectivity.nominatim.status.toUpperCase()} ({data.connectivity.nominatim.code})</Badge>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> Google News RSS</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{data.connectivity.gnews_rss.time}ms</span>
                                <Badge variant={data.connectivity.gnews_rss.status === 'ok' ? 'outline' : 'destructive'}>{data.connectivity.gnews_rss.status.toUpperCase()} ({data.connectivity.gnews_rss.code})</Badge>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> GNews API (Real Test)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{data.connectivity.gnews_api?.time || 0}ms</span>
                                <Badge variant={data.connectivity.gnews_api?.status === 'ok' ? 'outline' : 'destructive'}>
                                    {data.connectivity.gnews_api?.status.toUpperCase()} ({data.connectivity.gnews_api?.code})
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
