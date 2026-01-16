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
      console.error('GOOGLE_PLACES_API_KEY environment variable not set.');
      throw new Error('Google Places API Key is missing on server.');
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
        throw new Error(`Google Places API Error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      if (!data.places) {
        return [];
      }

      const services: Service[] = data.places.map((place: any) => {

        let imageUrl = `https://picsum.photos/seed/${place.id}/400/300`; // Default placeholder
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
        }
      });

      return services;

    } catch (error) {
      console.error('Error calling Google Places API:', error);
      throw error;
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
      console.error("Directory search error:", e);
      return { places: [], error: e.message || "Unknown error searching directory" };
    }
  }
);

// Export a callable function that wraps the flow
export async function searchLocalDirectory(input: SearchLocalDirectoryInput): Promise<{ places: SearchLocalDirectoryOutput, error?: string }> {
  return searchLocalDirectoryFlow(input);
}
