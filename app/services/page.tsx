
'use client';

import type { Service, UserProfile } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Star, Verified, Search, Frown, Loader2, MapPin, Phone, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { searchLocalDirectory } from '@/ai/flows/search-local-directory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

function ServiceDetailDialog({ service, isOpen, onOpenChange }: { service: Service | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  if (!service) return null;

  const googleMapsUrl = service.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address)}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{service.name}</DialogTitle>
          <DialogDescription>{service.category}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative h-48 w-full overflow-hidden rounded-lg">
            <Image
              src={service.imageUrl || 'https://picsum.photos/seed/service/400/300'}
              alt={service.name}
              fill
              className="object-cover"
              data-ai-hint="service photo"
            />
          </div>
          <p className="text-sm text-foreground/80">{service.description}</p>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
            <span className="font-bold">{service.rating}</span>
            <span className="text-muted-foreground">({service.reviewCount} reviews)</span>
          </div>

          <div className="space-y-3 pt-4">
            {service.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${service.phone}`} className="text-sm hover:underline">{service.phone}</a>
              </div>
            )}
            {service.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm">{service.address}</span>
              </div>
            )}
            {service.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                  {service.website}
                </a>
              </div>
            )}
          </div>
        </div>
        {googleMapsUrl && (
          <Button asChild>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}


function ServiceCard({ service, onView }: { service: Service, onView: () => void }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full bg-muted">
          <Image
            src={service.imageUrl || 'https://picsum.photos/seed/service/400/300'}
            alt={service.name}
            fill
            className="object-cover"
            data-ai-hint="service photo"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg mb-1 font-semibold">{service.name}</CardTitle>
          {service.isVerified && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
              <Verified className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">{service.category}</CardDescription>
        <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{service.description}</p>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between items-center text-sm">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
          <span className="font-bold">{service.rating}</span>
          <span className="text-muted-foreground">({service.reviewCount})</span>
        </div>
        <Button size="sm" onClick={onView}>View</Button>
      </CardFooter>
    </Card>
  );
}

function ServiceSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-9 w-16" />
      </CardFooter>
    </Card>
  )
}

export default function ServiceDirectoryPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, `users/${authUser.uid}`) : null, [authUser, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.city && userProfile?.country) {
      const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(userProfile.country) || userProfile.country;
      setLocation(`${userProfile.city}, ${countryName}`);
    }
  }, [userProfile]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const results = await searchLocalDirectory({
        query: searchQuery,
        location: location,
      });
      setServices(results);
    } catch (e: any) {
      console.error(e);
      setError('Failed to search for services. Please ensure your Google Places API key is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsDetailOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h1 className="text-3xl font-bold">Local Service Directory</h1>
          <p className="text-muted-foreground">Discover businesses and services powered by Google Places.</p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., nigerian food"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., London, UK"
                className="pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery || !location}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ServiceSkeleton />
            <ServiceSkeleton />
            <ServiceSkeleton />
            <ServiceSkeleton />
          </div>
        )}

        {!isLoading && hasSearched && services.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} onView={() => handleViewDetails(service)} />
            ))}
          </div>
        )}

        {!isLoading && hasSearched && services.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
            <Frown className="w-12 h-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Services Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your search for "{searchQuery}" in {location} did not return any results.
            </p>
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/50 rounded-lg border-2 border-dashed">
            <Search className="w-12 h-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Search for Local Services</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the search bar above to find businesses in your area.
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-destructive/10 text-destructive-foreground rounded-lg border border-destructive">
            <Frown className="w-12 h-12" />
            <h2 className="mt-4 text-xl font-semibold">An Error Occurred</h2>
            <p className="mt-2 text-sm">
              {error}
            </p>
          </div>
        )}
      </div>
      <ServiceDetailDialog service={selectedService} isOpen={isDetailOpen} onOpenChange={setIsDetailOpen} />
    </>
  );
}
