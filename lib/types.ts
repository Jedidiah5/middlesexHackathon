export type ModelThemeCluster = {
  theme: string;
  percentage: number;
};

export type CityKeywords = {
  gemini: string[];
  perplexity: string[];
  shared: string[];
};

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
  /** Top theme clusters with % (from team handoff). */
  model_clusters?: {
    gemini: ModelThemeCluster[];
    perplexity: ModelThemeCluster[];
  };
  keywords?: CityKeywords;
  interesting_insight?: string;
};
