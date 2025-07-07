export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CryptoApiResponse {
  success: boolean;
  data: CryptoCoin[];
  timestamp: string;
  error?: string;
  message?: string;
}

// Historical price data point
export interface PriceDataPoint {
  timestamp: number;
  date: Date;
  price: number;
}

export interface MarketCapDataPoint {
  timestamp: number;
  date: Date;
  market_cap: number;
}

export interface VolumeDataPoint {
  timestamp: number;
  date: Date;
  volume: number;
}

// Chart data structure
export interface ChartData {
  prices: PriceDataPoint[];
  market_caps: MarketCapDataPoint[];
  total_volumes: VolumeDataPoint[];
}

export interface CoinDetails extends CryptoCoin {
  description?: string;
  homepage?: string;
  blockchain_site?: string[];
  official_forum_url?: string[];
  chat_url?: string[];
  announcement_url?: string[];
  twitter_screen_name?: string;
  facebook_username?: string;
  bitcointalk_thread_identifier?: number;
  telegram_channel_identifier?: string;
  subreddit_url?: string;
  repos_url?: { github?: string[]; bitbucket?: string[] };
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  price_chart_data?: ChartData;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  sentiment?: "positive" | "negative" | "neutral";
  relevanceScore?: number;
}

export interface PredictionResult {
  prediction: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  timeframe: string;
  factors: {
    technical: number;
    sentiment: number;
    fundamental: number;
  };
  generatedAt: string;
}