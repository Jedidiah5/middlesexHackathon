export type City = {
  city: string;
  country: string;
  lat: number;
  lon: number;
  gemini_sentiment: number;
  perplexity_sentiment: number;
  top_themes: string[];
  gemini_summary: string;
  perplexity_summary: string;
};
