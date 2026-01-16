
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: Timestamp;
  role: 'user' | 'moderator' | 'admin';
  city: string;
  country: string;
  verificationLevel: 'unverified' | 'phone' | 'id';
  lastKnownIp?: string;
  phoneNumber: string;
};

export type PostCategory = 'general' | 'alert' | 'job' | 'housing' | 'service' | 'event' | 'poll';

export type AlertType = 'informational' | 'urgent' | 'safety';

export type PostMedia = {
  url: string;
  type: 'image' | 'video';
}

export type Post = {
  id: string;
  authorId: string;
  category: PostCategory;
  content: string;
  createdAt: Timestamp;
  likeCount: number;
  commentCount: number;
  media?: PostMedia[];
  alertType?: AlertType;
  location?: string;
  city?: string;
  country?: string;
  voiceNoteUrl?: string;
};

export type Comment = {
  id: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
}

export type Like = {
  id: string; // The user's UID
  userId: string;
  createdAt: Timestamp;
}

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  phone?: string;
  website?: string;
  address?: string;
};

export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed' | 'dismiss_deleted';

export type Report = {
  id: string;
  reporterId: string;
  reportedContentType: 'post' | 'comment' | 'user' | 'service';
  reportedContentId: string;
  reason: string;
  status: ReportStatus;
  timestamp: Timestamp;
  moderatorId?: string;
  actionTaken?: string;
}

export const ValidateLocationInputSchema = z.object({
  city: z.string().describe('The city to validate.'),
  country: z.string().describe('The two-letter ISO 3166-1 country code (e.g., "GB", "US").'),
});
export type ValidateLocationInput = z.infer<typeof ValidateLocationInputSchema>;

export const ValidateLocationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the city was found within the country.'),
});
export type ValidateLocationOutput = z.infer<typeof ValidateLocationOutputSchema>;

export const FetchCitiesInputSchema = z.object({
  country: z.string().describe('The name of the country to fetch cities for (e.g., "United Kingdom").'),
});
export type FetchCitiesInput = z.infer<typeof FetchCitiesInputSchema>;

export const FetchCitiesOutputSchema = z.array(z.string()).describe('A list of city names for the given country.');
export type FetchCitiesOutput = z.infer<typeof FetchCitiesOutputSchema>;

export const FetchCitySuggestionsInputSchema = z.object({
  input: z.string().describe('The partial text to search for.'),
  country: z.string().min(2).max(2).describe('The two-letter ISO 3166-1 country code (e.g., "GB", "US").'),
});
export type FetchCitySuggestionsInput = z.infer<typeof FetchCitySuggestionsInputSchema>;

export const CitySuggestionSchema = z.object({
  description: z.string(),
  place_id: z.string(),
});
export type CitySuggestion = z.infer<typeof CitySuggestionSchema>;

export const FetchCitySuggestionsOutputSchema = z.array(CitySuggestionSchema);
export type FetchCitySuggestionsOutput = z.infer<typeof FetchCitySuggestionsOutputSchema>;
