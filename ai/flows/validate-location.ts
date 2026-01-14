
'use server';
/**
 * @fileOverview A flow for validating if a city exists within a given country.
 *
 * - validateLocation - A function that checks the validity of a city/country pair.
 */

import { ai } from '@/ai/genkit';
import { ValidateLocationInputSchema, ValidateLocationOutputSchema, type ValidateLocationInput, type ValidateLocationOutput } from '@/lib/types';
import fetch from 'node-fetch';


const validateLocationTool = ai.defineTool(
  {
    name: 'validateLocationWithGoogle',
    description: 'Validates a city and country pair using the Google Places API.',
    inputSchema: ValidateLocationInputSchema,
    outputSchema: ValidateLocationOutputSchema,
  },
  async ({ city, country }) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY environment variable not set.');
      // In a real app, you might want to fall back to a less strict validation or skip it.
      // For now, we'll consider it valid if the API key is missing to not block development.
      return { isValid: true };
    }
    
    // We use the Geocoding API to check if the location exists and what country it's in.
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API request failed with status ${response.status}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        // No results found for the city
        return { isValid: false };
      }

      // Check if any of the results match the provided country code
      const foundInCountry = data.results.some((result: any) => {
        const countryComponent = result.address_components.find((comp: any) =>
          comp.types.includes('country')
        );
        return countryComponent && countryComponent.short_name.toUpperCase() === country.toUpperCase();
      });

      return { isValid: foundInCountry };
    } catch (error) {
      console.error('Error calling Geocoding API:', error);
      // In case of an API error, we can be permissive or strict.
      // Being permissive prevents a user from being blocked by a temporary API issue.
      return { isValid: true };
    }
  }
);


const validateLocationFlow = ai.defineFlow(
  {
    name: 'validateLocationFlow',
    inputSchema: ValidateLocationInputSchema,
    outputSchema: ValidateLocationOutputSchema,
  },
  async (input) => {
    return validateLocationTool(input);
  }
);

// Export a callable function that wraps the flow
export async function validateLocation(input: ValidateLocationInput): Promise<ValidateLocationOutput> {
  return validateLocationFlow(input);
}
