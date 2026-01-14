
'use server';
/**
 * @fileOverview A flow for fetching city suggestions for a given country using Google Places Autocomplete.
 *
 * - fetchCitySuggestions - A function that retrieves a list of city suggestions.
 * - FetchCitySuggestionsInput - The input type for the fetchCitySuggestions function.
 * - FetchCitySuggestionsOutput - The return type for the fetchCitySuggestions function.
 */

import { ai } from '@/ai/genkit';
import { FetchCitySuggestionsInputSchema, FetchCitySuggestionsOutputSchema, type FetchCitySuggestionsInput, type FetchCitySuggestionsOutput } from '@/lib/types';
import fetch from 'node-fetch';

const fetchCitySuggestionsFromGoogle = ai.defineTool(
  {
    name: 'fetchCitySuggestionsFromGoogle',
    description: 'Fetches city suggestions from the Google Places Autocomplete API.',
    inputSchema: FetchCitySuggestionsInputSchema,
    outputSchema: FetchCitySuggestionsOutputSchema,
  },
  async ({ input, country }) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY environment variable not set.');
      return [];
    }
    
    // sessiontoken is a random string for billing purposes.
    const sessionToken = `japahub-session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=(cities)&components=country:${country}&sessiontoken=${sessionToken}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Places Autocomplete API request failed with status ${response.status}`);
      }
      
      const data: any = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places Autocomplete API Error:', data.error_message);
        throw new Error(data.error_message || 'Failed to fetch city suggestions.');
      }
      
      return (data.predictions || []).map((p: any) => ({
        description: p.description,
        place_id: p.place_id,
      }));

    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return []; // Return empty array on error to prevent crashing the client
    }
  }
);


const fetchCitySuggestionsFlow = ai.defineFlow(
  {
    name: 'fetchCitySuggestionsFlow',
    inputSchema: FetchCitySuggestionsInputSchema,
    outputSchema: FetchCitySuggestionsOutputSchema,
  },
  async (input) => {
    return fetchCitySuggestionsFromGoogle(input);
  }
);

export async function fetchCitySuggestions(input: FetchCitySuggestionsInput): Promise<FetchCitySuggestionsOutput> {
  return fetchCitySuggestionsFlow(input);
}
