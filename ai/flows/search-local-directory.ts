'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Service } from '@/lib/types';
import fetch from 'node-fetch';

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


const findPlacesTool = ai.defineTool(
  {
    name: 'findPlaces',
    description: 'Finds places based on a query and location using OpenStreetMap Nominatim API. Free and reliable.',
    inputSchema: SearchLocalDirectoryInputSchema,
    outputSchema: SearchLocalDirectoryOutputSchema,
  },
  async ({ query, location }) => {
    console.log(`Searching for ${query} in ${location} via Nominatim`);

    // Nominatim URL
    const fullQuery = `${query} in ${location}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=12&extratags=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'JapaHub/1.0 (japahub@example.com)' // Nominatim requires a User-Agent
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim API Error: ${response.status}`);
      }

      const places: any[] = await response.json();

      if (!places || !Array.isArray(places)) {
        return [];
      }

      const services: Service[] = places.map((place: any) => {
        // Nominatim returns simplified data compared to Google, so we map carefully.
        const name = place.name || place.display_name.split(',')[0];
        const category = place.type ? place.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Service';

        // Nominatim doesn't provide images or ratings usually.
        // We use a placeholder based on ID.
        const imageUrl = `https://picsum.photos/seed/${place.place_id}/400/300`;

        return {
          id: `osm_${place.place_id}`,
          name: name,
          category: category,
          description: place.display_name || `Located at ${name}`,
          imageUrl: imageUrl,
          rating: 0, // Not available in basic Nominatim
          reviewCount: 0,
          isVerified: false,
          // Phone and website are in extratags if available
          phone: place.extratags?.phone || place.extratags?.['contact:phone'],
          website: place.extratags?.website || place.extratags?.['contact:website'],
          address: place.display_name,
        }
      });

      return services;

    } catch (error) {
      console.error('Error calling Nominatim API:', error);
      throw new Error(`Failed to search directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
