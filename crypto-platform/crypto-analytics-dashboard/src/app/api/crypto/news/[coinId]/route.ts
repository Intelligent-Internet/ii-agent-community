import { NextRequest, NextResponse } from "next/server";

// Using NewsAPI for cryptocurrency news
const NEWS_API_KEY = process.env.NEWS_API_KEY || "demo_key";
const NEWS_API_BASE = "https://newsapi.org/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  try {
    const { coinId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "3");
    
    // Calculate date range (past N days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Create search query based on coin ID
    const coinNameMap: { [key: string]: string[] } = {
      bitcoin: ["Bitcoin", "BTC"],
      ethereum: ["Ethereum", "ETH"],
      tether: ["Tether", "USDT"],
      "binance-coin": ["Binance", "BNB"],
      solana: ["Solana", "SOL"],
      xrp: ["XRP", "Ripple"],
      cardano: ["Cardano", "ADA"],
      dogecoin: ["Dogecoin", "DOGE"],
      avalanche: ["Avalanche", "AVAX"],
      polkadot: ["Polkadot", "DOT"],
    };

    const searchTerms = coinNameMap[coinId] || [coinId];
    const query = searchTerms.join(" OR ") + " AND cryptocurrency";

    // For demo purposes, if no NEWS_API_KEY is set, return mock data
    if (NEWS_API_KEY === "demo_key") {
      return NextResponse.json(generateMockNews(coinId, searchTerms[0]));
    }

    const newsUrl = `${NEWS_API_BASE}/everything?` + new URLSearchParams({
      q: query,
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
      language: "en",
      sortBy: "relevancy",
      pageSize: "10",
      apiKey: NEWS_API_KEY,
    });

    console.log(`Fetching news for ${coinId} with query: ${query}`);

    const response = await fetch(newsUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!response.ok) {
      console.error(`News API error: ${response.status} ${response.statusText}`);
      // Return mock data as fallback
      return NextResponse.json(generateMockNews(coinId, searchTerms[0]));
    }

    const data = await response.json();
    
    // Transform and filter the news data
    const transformedArticles = data.articles
      ?.filter((article: any) => 
        article.title && 
        article.description && 
        article.url &&
        !article.title.toLowerCase().includes('[removed]')
      )
      .map((article: any) => ({
        id: `${article.source.id || 'unknown'}-${Date.parse(article.publishedAt)}`,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: {
          id: article.source.id || 'unknown',
          name: article.source.name || 'Unknown Source'
        },
        sentiment: analyzeSentiment(article.title + " " + article.description),
        relevanceScore: calculateRelevanceScore(article, searchTerms)
      }))
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Limit to 8 most relevant articles

    return NextResponse.json({
      success: true,
      articles: transformedArticles || [],
      totalResults: transformedArticles?.length || 0,
      coinId,
      searchTerms,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Return mock data as fallback for any errors
    const { coinId } = await params;
    const coinNameMap: { [key: string]: string } = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum", 
      tether: "Tether",
      "binance-coin": "Binance Coin",
      solana: "Solana",
      xrp: "XRP",
      cardano: "Cardano",
      dogecoin: "Dogecoin",
    };
    
    return NextResponse.json(generateMockNews(coinId, coinNameMap[coinId] || coinId));
  }
}

function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = [
    "bullish", "surge", "rally", "gains", "pump", "moon", "breakthrough", 
    "adoption", "partnership", "upgrade", "innovation", "growth", "rise",
    "soar", "climb", "green", "profit", "milestone", "success", "optimistic"
  ];
  
  const negativeWords = [
    "bearish", "crash", "dump", "drop", "fall", "decline", "loss", "down",
    "red", "sell-off", "correction", "weakness", "concern", "risk", "volatility",
    "panic", "fear", "uncertainty", "regulation", "ban", "hack", "exploit"
  ];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

function calculateRelevanceScore(article: any, searchTerms: string[]): number {
  let score = 0;
  const title = article.title?.toLowerCase() || "";
  const description = article.description?.toLowerCase() || "";
  
  searchTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    if (title.includes(lowerTerm)) score += 3;
    if (description.includes(lowerTerm)) score += 2;
  });

  // Boost recent articles
  const daysOld = (Date.now() - Date.parse(article.publishedAt)) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 3 - daysOld);

  return score;
}

function generateMockNews(coinId: string, coinName: string) {
  const mockArticles = [
    {
      id: `mock-1-${coinId}`,
      title: `${coinName} Shows Strong Technical Signals Amid Market Recovery`,
      description: `Technical analysis suggests ${coinName} is forming bullish patterns as the broader cryptocurrency market shows signs of recovery. Analysts point to increased trading volume and institutional interest.`,
      url: `https://cryptonews.example.com/${coinId}-technical-analysis`,
      urlToImage: `https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=200&fit=crop`,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      source: { id: "crypto-insider", name: "Crypto Insider" },
      sentiment: "positive" as const,
      relevanceScore: 9.2
    },
    {
      id: `mock-2-${coinId}`,
      title: `Major Exchange Lists ${coinName} Derivatives, Increasing Liquidity`,
      description: `A leading cryptocurrency exchange announced the listing of ${coinName} perpetual futures, providing traders with new opportunities and increasing overall market liquidity.`,
      url: `https://exchangenews.example.com/${coinId}-derivatives-listing`,
      urlToImage: `https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=200&fit=crop`,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      source: { id: "exchange-times", name: "Exchange Times" },
      sentiment: "positive" as const,
      relevanceScore: 8.5
    },
    {
      id: `mock-3-${coinId}`,
      title: `${coinName} Network Upgrade Promises Enhanced Scalability`,
      description: `The upcoming network upgrade for ${coinName} is expected to significantly improve transaction throughput and reduce fees, according to core developers.`,
      url: `https://blockchain.example.com/${coinId}-network-upgrade`,
      urlToImage: `https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop`,
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      source: { id: "blockchain-daily", name: "Blockchain Daily" },
      sentiment: "positive" as const,
      relevanceScore: 8.8
    },
    {
      id: `mock-4-${coinId}`,
      title: `Market Analysis: ${coinName} Faces Resistance at Key Levels`,
      description: `${coinName} is currently testing important resistance levels as traders watch for a potential breakout. Volume indicators suggest mixed sentiment among market participants.`,
      url: `https://tradingview.example.com/${coinId}-market-analysis`,
      urlToImage: `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop`,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      source: { id: "trading-insights", name: "Trading Insights" },
      sentiment: "neutral" as const,
      relevanceScore: 7.2
    },
    {
      id: `mock-5-${coinId}`,
      title: `Institutional Adoption of ${coinName} Continues to Grow`,
      description: `Several Fortune 500 companies have added ${coinName} to their treasury reserves this quarter, signaling growing institutional acceptance of digital assets.`,
      url: `https://institutional.example.com/${coinId}-corporate-adoption`,
      urlToImage: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop`,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      source: { id: "corporate-crypto", name: "Corporate Crypto" },
      sentiment: "positive" as const,
      relevanceScore: 8.1
    }
  ];

  return {
    success: true,
    articles: mockArticles,
    totalResults: mockArticles.length,
    coinId,
    searchTerms: [coinName],
    dateRange: {
      from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    }
  };
}