'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Service } from '@/lib/types';

// Schemas
const SearchLocalDirectoryInputSchema = z.object({
  query: z.string().describe('The search query for the business or service (e.g., "restaurants", "plumbers").'),
  location: z.string().describe('The location to search in (e.g., "London, UK", "Houston, TX").'),
});
export type SearchLocalDirectoryInput = z.infer<typeof SearchLocalDirectoryInputSchema>;

const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  isVerified: z.boolean().default(false),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
});

const SearchLocalDirectoryOutputSchema = z.array(PlaceSchema);
export type SearchLocalDirectoryOutput = z.infer<typeof SearchLocalDirectoryOutputSchema>;

// --- 1. Google Places Strategy ---
async function fetchFromGooglePlaces(query: string, location: string): Promise<Service[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API Key missing');

  const fullQuery = `${query} in ${location}`;
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.types,places.id,places.photos',
    },
    body: JSON.stringify({
      textQuery: fullQuery,
      maxResultCount: 12,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places API returned ${response.status}`);
  }

  const data: any = await response.json();
  if (!data.places || data.places.length === 0) {
    return [];
  }

  return data.places.map((place: any) => {
    let imageUrl = `https://picsum.photos/seed/${place.id}/400/300`;
    if (place.photos && place.photos.length > 0) {
      const photoName = place.photos[0].name;
      imageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${apiKey}`;
    }

    return {
      id: `gen_${place.id}`,
      name: place.displayName?.text || 'Unknown Name',
      category: place.types?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Service',
      description: `Located at ${place.formattedAddress || 'an undisclosed location'}.`,
      imageUrl: imageUrl,
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      isVerified: false,
      phone: place.nationalPhoneNumber,
      website: place.websiteUri,
      address: place.formattedAddress,
    };
  });
}

// --- 2. Nominatim Strategy (Fallback) ---
async function fetchFromNominatim(query: string, location: string): Promise<Service[]> {
  console.log(`[Nominatim Fallback] Searching: ${query} in ${location}`);
  const fullQuery = `${query} in ${location}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=12&extratags=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'JapaHub/1.0 (japahub@example.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim API returned ${response.status}`);
  }

  const places: any[] = await response.json();
  if (!places || !Array.isArray(places)) return [];

  return places.map((place: any) => {
    const name = place.name || place.display_name.split(',')[0];
    const category = place.type ? place.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Service';

    return {
      id: `osm_${place.place_id}`,
      name: name,
      category: category,
      description: place.display_name || `Located at ${name}`,
      imageUrl: `https://picsum.photos/seed/${place.place_id}/400/300`,
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      phone: place.extratags?.phone || place.extratags?.['contact:phone'],
      website: place.extratags?.website || place.extratags?.['contact:website'],
      address: place.display_name,
    };
  });
}

// --- Main Tool ---
const findPlacesTool = ai.defineTool(
  {
    name: 'findPlaces',
    description: 'Finds places using Google Places with Nominatim fallback.',
    inputSchema: SearchLocalDirectoryInputSchema,
    outputSchema: SearchLocalDirectoryOutputSchema,
  },
  async ({ query, location }) => {
    try {
      console.log('[findPlaces] Attempting Google Places...');
      const places = await fetchFromGooglePlaces(query, location);
      if (places.length > 0) {
        console.log(`[findPlaces] Google Places returned ${places.length} results.`);
        return places;
      }
      console.log('[findPlaces] Google Places returned 0 results. Switching to Nominatim.');
    } catch (e) {
      console.warn('[findPlaces] Google Places failed. Switching to Nominatim.', e);
    }

    try {
      const osmPlaces = await fetchFromNominatim(query, location);
      console.log(`[findPlaces] Nominatim returned ${osmPlaces.length} results.`);
      return osmPlaces;
    } catch (e) {
      console.error('[findPlaces] Both strategies failed.', e);
      throw new Error('Unable to find services from any source.');
    }
  }
);

const searchLocalDirectoryFlow = ai.defineFlow(
  {
    name: 'searchLocalDirectoryFlow',
    inputSchema: SearchLocalDirectoryInputSchema,
    outputSchema: z.object({
      places: SearchLocalDirectoryOutputSchema,
      error: z.string().optional()
    }),
  },
  async (input) => {
    try {
      const places = await findPlacesTool(input);
      return { places };
    } catch (e: any) {
      return { places: [], error: e.message || "Unknown error searching directory" };
    }
  }
);

export async function searchLocalDirectory(input: SearchLocalDirectoryInput): Promise<{ places: SearchLocalDirectoryOutput, error?: string }> {
  return searchLocalDirectoryFlow(input);
}
