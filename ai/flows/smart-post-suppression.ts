'use server';

/**
 * @fileOverview A smart post suppression AI agent.
 *
 * - suppressPost - A function that determines whether a post should be suppressed.
 * - SuppressPostInput - The input type for the suppressPost function.
 * - SuppressPostOutput - The return type for the suppressPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuppressPostInputSchema = z.object({
  postText: z.string().describe('The text content of the post.'),
  spamScore: z.number().describe('The spam score of the post (0-1).'),
  reportCount: z.number().describe('The number of user reports for the post.'),
});
export type SuppressPostInput = z.infer<typeof SuppressPostInputSchema>;

const SuppressPostOutputSchema = z.object({
  shouldSuppress: z
    .boolean()
    .describe(
      'Whether the post should be suppressed based on its content, spam score, and report count.'
    ),
  reason: z.string().describe('The reason for suppressing the post.'),
});
export type SuppressPostOutput = z.infer<typeof SuppressPostOutputSchema>;

export async function suppressPost(
  input: SuppressPostInput
): Promise<SuppressPostOutput> {
  return suppressPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suppressPostPrompt',
  input: {schema: SuppressPostInputSchema},
  output: {schema: SuppressPostOutputSchema},
  prompt: `You are an AI content moderator that will analyze a post and decide whether it should be suppressed.

  Consider the following factors:
  - The post's text content: "{{postText}}"
  - The post's spam score: {{spamScore}}
  - The number of user reports: {{reportCount}}

  If the spam score is high (e.g., > 0.7) or the report count is significant (e.g., > 5), you should generally suppress the post.
  Also suppress the post if the text contains harmful content.

  Return a JSON object with the following fields:
  - shouldSuppress: true if the post should be suppressed, false otherwise.
  - reason: A brief explanation of why the post should be suppressed.
  `,
});

const suppressPostFlow = ai.defineFlow(
  {
    name: 'suppressPostFlow',
    inputSchema: SuppressPostInputSchema,
    outputSchema: SuppressPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
