'use server';
/**
 * @fileOverview A flow for searching a local business directory using the Google Places API.
 *
 * - searchLocalDirectory - A function that searches for local businesses.
 * - SearchLocalDirectoryInput - The input type for the searchLocalDirectory function.
 * - SearchLocalDirectoryOutput - The return type for the searchLocalDirectory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Service } from '@/lib/types';
import fetch from 'node-fetch';

const SearchLocalDirectoryInputSchema = z.object({
  query: z.string().describe('The search query for the business or service (e.g., "restaurants", "plumbers").'),
  location: z.string().describe('The location to search in (e.g., "London, UK", "Houston, TX").'),
});
export type SearchLocalDirectoryInput = z.infer<typeof SearchLocalDirectoryInputSchema>;

// Define a schema for a single place result from the Google Places API
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


const findPlacesTool = ai.defineTool(
  {
    name: 'findPlaces',
    description: 'Finds places based on a query and location using Google Places API.',
    inputSchema: SearchLocalDirectoryInputSchema,
    outputSchema: SearchLocalDirectoryOutputSchema,
  },
  async ({ query, location }) => {
    console.log(`Searching for ${query} in ${location}`);
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY environment variable not set. Please set it in your .env file.');
      throw new Error('The Google Places API key is not configured. Please set the GOOGLE_PLACES_API_KEY environment variable.');
    }

    const fullQuery = `${query} in ${location}`;
    const url = `https://places.googleapis.com/v1/places:searchText`;

    try {
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
        const errorBody = await response.text();
        throw new Error(`Google Places API request failed with status ${response.status}: ${errorBody}`);
      }

      const data: any = await response.json();
      if (!data.places) {
        return [];
      }
      
      const services: Service[] = data.places.map((place: any) => {
        
        let imageUrl = `https://picsum.photos/seed/${place.id}/400/300`; // Default placeholder
        if(place.photos && place.photos.length > 0) {
            // Construct the photo URL
            // The photo reference is `places/{place_id}/photos/{photo_reference}`
            // We need to pass this to the photo API endpoint
            const photoName = place.photos[0].name;
            imageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${apiKey}`;
        }
        
        return {
            id: `gen_${place.id}`, // Prefix to distinguish from internal IDs
            name: place.displayName?.text || 'Unknown Name',
            category: place.types?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, (l:string) => l.toUpperCase()) || 'Service',
            description: `Located at ${place.formattedAddress || 'an undisclosed location'}.`,
            imageUrl: imageUrl,
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            isVerified: false, // Google Places results are not verified by our system by default
            phone: place.nationalPhoneNumber,
            website: place.websiteUri,
            address: place.formattedAddress,
        }
      });

      return services;

    } catch (error) {
      console.error('Error calling Google Places API:', error);
      // Re-throw the error so it can be caught by the client
      throw error;
    }
  }
);


const searchLocalDirectoryFlow = ai.defineFlow(
  {
    name: 'searchLocalDirectoryFlow',
    inputSchema: SearchLocalDirectoryInputSchema,
    outputSchema: SearchLocalDirectoryOutputSchema,
  },
  async (input) => {
     // Directly call the tool. No complex prompting needed for this use case.
    return findPlacesTool(input);
  }
);

// Export a callable function that wraps the flow
export async function searchLocalDirectory(input: SearchLocalDirectoryInput): Promise<SearchLocalDirectoryOutput> {
  return searchLocalDirectoryFlow(input);
}
