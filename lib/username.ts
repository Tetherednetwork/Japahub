import { isUsernameAvailable } from "@/firebase/auth/auth";

/**
 * Generates a list of unique username suggestions based on a given username.
 * @param baseUsername The initial username that is taken.
 * @returns A promise that resolves to an array of available username strings.
 */
export async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const maxSuggestions = 4;

  // Clean base username to ensure it follows rules
  const cleanBase = baseUsername.toLowerCase().replace(/[^a-z0-9_.]/g, '');

  // Strategy for variations
  const variations = [
    `${cleanBase}_`,                // append underscore
    `${cleanBase}.official`,        // append .official
    `the_${cleanBase}`,             // prepend the_
    `${cleanBase}${Math.floor(Math.random() * 99) + 1}`, // append random 2 digits
    `${cleanBase}_${Math.floor(Math.random() * 99) + 1}`, // append underscore and random digits
    `real.${cleanBase}`,            // prepend real.
    `${cleanBase}.ng`,              // localized (could be dynamic based on country in future)
    `${cleanBase}247`,              // append 247
  ];

  // Randomize variations order slightly to give variety
  variations.sort(() => Math.random() - 0.5);

  for (const variation of variations) {
    if (suggestions.length >= maxSuggestions) break;

    // Check if the suggestion is available
    const isAvailable = await isUsernameAvailable(variation);

    if (isAvailable && !suggestions.includes(variation)) {
      suggestions.push(variation);
    }
  }

  return suggestions;
}
