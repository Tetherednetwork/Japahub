
'use server';
/**
 * @fileOverview A flow for fetching cities for a given country.
 *
 * - fetchCities - A function that retrieves a list of cities.
 * - FetchCitiesInput - The input type for the fetchCities function.
 * - FetchCitiesOutput - The return type for the fetchCities function.
 */

import { ai } from '@/ai/genkit';
import { FetchCitiesInputSchema, FetchCitiesOutputSchema, type FetchCitiesInput, type FetchCitiesOutput } from '@/lib/types';
import fetch from 'node-fetch';

const fetchCitiesFromApi = ai.defineTool(
  {
    name: 'fetchCitiesFromApi',
    description: 'Fetches cities for a given country using an external API.',
    inputSchema: FetchCitiesInputSchema,
    outputSchema: FetchCitiesOutputSchema,
  },
  async ({ country }) => {
    const url = 'https://countriesnow.space/api/v0.1/countries/cities';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country }),
      });

      if (!response.ok) {
        throw new Error(`Cities API request failed with status ${response.status}`);
      }

      const data: any = await response.json();

      if (data.error) {
        console.warn(`Could not find cities for country: ${country}`);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }
);

const fetchCitiesFlow = ai.defineFlow(
  {
    name: 'fetchCitiesFlow',
    inputSchema: FetchCitiesInputSchema,
    outputSchema: FetchCitiesOutputSchema,
  },
  async (input) => {
    return fetchCitiesFromApi(input);
  }
);

export async function fetchCities(input: FetchCitiesInput): Promise<FetchCitiesOutput> {
  return fetchCitiesFlow(input);
}
