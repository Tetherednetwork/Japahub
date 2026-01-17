'use client';

import { Briefcase, Frown, Loader2, MapPin, Search, Star, Phone, Globe, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile, Service } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { searchLocalDirectory } from '@/ai/flows/search-local-directory';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

function JobCard({ job }: { job: Service }) {
    const googleMapsUrl = job.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}` : null;
    return (
        <Card className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
                <div className="relative h-40 w-full bg-muted">
                    <Image
                        src={job.imageUrl || 'https://picsum.photos/seed/job/400/300'}
                        alt={job.name}
                        fill
                        className="object-cover"
                        data-ai-hint="company building"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-1 font-semibold">{job.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{job.category}</CardDescription>
                <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{job.description}</p>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 flex flex-col items-start gap-3">
                <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                    <span className="font-bold">{job.rating}</span>
                    <span className="text-muted-foreground">({job.reviewCount} reviews)</span>
                </div>
                <div className="flex w-full gap-2">
                    {job.website && (
                        <Button size="sm" asChild className="flex-1">
                            <a href={job.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Website</a>
                        </Button>
                    )}
                    {googleMapsUrl && (
                        <Button size="sm" variant="secondary" asChild className="flex-1">
                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><MapPin className="mr-2 h-4 w-4" />Directions</a>
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}


function JobSkeleton() {
    return (
        <Card className="overflow-hidden flex flex-col">
            <Skeleton className="h-40 w-full" />
            <CardContent className="p-4 flex-grow space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 flex flex-col items-start gap-3">
                <Skeleton className="h-5 w-1/4" />
                <div className="flex w-full gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                </div>
            </CardFooter>
        </Card>
    )
}

export default function JobsPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, `users/${authUser.uid}`) : null, [authUser, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const [jobs, setJobs] = useState<Service[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');

    // Filters
    const [industry, setIndustry] = useState('all');
    const [jobType, setJobType] = useState('all');
    const [isDeepSearch, setIsDeepSearch] = useState(false);
    const [visa, setVisa] = useState(false);
    const [noExp, setNoExp] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile?.city && userProfile?.country) {
            const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(userProfile.country) || userProfile.country;
            setLocation(`${userProfile.city}, ${countryName}`);
        }
    }, [userProfile]);

    const handleSearch = async () => {
        setIsLoading(true);
        setHasSearched(true);
        setError(null);
        setJobs([]);

        try {
            // Construct Advanced Query
            let finalQuery = searchQuery;

            // If query is empty but filters are set, create a general query
            if (!finalQuery && (industry !== 'all' || jobType !== 'all' || visa || noExp)) {
                finalQuery = "Jobs";
            } else if (!finalQuery) {
                // If everything is empty (initial state), do nothing
                setIsLoading(false);
                return;
            }

            if (jobType !== 'all') {
                finalQuery = `${jobType} ${finalQuery}`;
            }
            if (industry !== 'all') {
                finalQuery = `${finalQuery} in ${industry}`;
            }

            // Specialized Filters
            if (visa) {
                finalQuery = `${finalQuery} (Visa Sponsorship OR Tier 2 Sponsorship)`;
            }
            if (noExp) {
                finalQuery = `${finalQuery} (Entry Level OR No Experience OR Junior)`;
            }

            // For Deep Search, we append keywords that trigger "hiring" intent in Directory searches
            if (isDeepSearch) {
                finalQuery = `${finalQuery} (Recruitment OR Hiring OR Careers)`;
            }

            console.log("Searching Jobs with Query:", finalQuery);

            const { places, error: searchError } = await searchLocalDirectory({
                query: finalQuery,
                location: location,
            });

            if (searchError) {
                console.error("Jobs search error:", searchError);
                setError(searchError);
            } else {
                setJobs(places);
            }
        } catch (e: any) {
            console.error(e);
            setError('Failed to search for jobs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-card p-6 rounded-lg border">
                <h1 className="text-3xl font-bold">Local Job Listings</h1>
                <p className="text-muted-foreground">Find local companies and potential job opportunities.</p>

                <div className="mt-6 flex flex-col gap-4">
                    {/* Main Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by role (e.g. Nurse, Driver)..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Location (e.g. London, UK)..."
                                className="pl-10"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-4 rounded-md border border-dashed">
                        <div className="w-full sm:w-40">
                            <Label className="text-xs mb-1.5 block text-muted-foreground">Industry</Label>
                            <Select value={industry} onValueChange={setIndustry}>
                                <SelectTrigger className="w-full bg-background h-9">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Industries</SelectItem>
                                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    <SelectItem value="Technology">Technology</SelectItem>
                                    <SelectItem value="Finance">Finance</SelectItem>
                                    <SelectItem value="Construction">Construction</SelectItem>
                                    <SelectItem value="Education">Education</SelectItem>
                                    <SelectItem value="Retail">Retail</SelectItem>
                                    <SelectItem value="Hospitality">Hospitality</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-40">
                            <Label className="text-xs mb-1.5 block text-muted-foreground">Job Type</Label>
                            <Select value={jobType} onValueChange={setJobType}>
                                <SelectTrigger className="w-full bg-background h-9">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Internship">Internship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Special Filters */}
                        <div className="flex items-center gap-2 pt-5">
                            <Checkbox id="visa" checked={visa} onCheckedChange={(c) => setVisa(!!c)} />
                            <Label htmlFor="visa" className="cursor-pointer font-medium text-sm">Visa Sponsorship</Label>
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                            <Checkbox id="no-exp" checked={noExp} onCheckedChange={(c) => setNoExp(!!c)} />
                            <Label htmlFor="no-exp" className="cursor-pointer font-medium text-sm">No Experience</Label>
                        </div>

                        <div className="ml-auto flex items-center gap-2 pt-5 sm:border-l sm:pl-4">
                            <Switch id="deep-search" checked={isDeepSearch} onCheckedChange={setIsDeepSearch} />
                            <div className="flex flex-col">
                                <Label htmlFor="deep-search" className="cursor-pointer font-medium">Deep Search</Label>
                                <span className="text-[10px] text-muted-foreground">Include recruitment agencies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <JobSkeleton /><JobSkeleton /><JobSkeleton /><JobSkeleton />
                </div>
            )}

            {!isLoading && hasSearched && jobs.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}

            {!isLoading && hasSearched && jobs.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
                    <Frown className="w-12 h-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No Results Found</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your search for "{searchQuery}" in {location} did not return any results. <br />
                        Try adjusting your filters or enabling "Deep Search".
                    </p>
                </div>
            )}

            {!isLoading && !hasSearched && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
                    <Briefcase className="w-12 h-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Find Your Next Role</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Use the search bar and filters above to find local companies and opportunities.
                    </p>
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-destructive/10 text-destructive-foreground rounded-lg border border-destructive">
                    <Frown className="w-12 h-12" />
                    <h2 className="mt-4 text-xl font-semibold">An Error Occurred</h2>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}