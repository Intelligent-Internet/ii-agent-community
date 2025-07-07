import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { coinId } = await params;

    // Get user's OpenAI API key
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    });

    // Temporary fallback API key for testing
    const fallbackApiKey = "sk-fill-your-key-here"

    let openaiApiKey = user?.settings?.openaiApiKey;
    
    // Use fallback API key if no key is stored in database
    if (!openaiApiKey) {
      openaiApiKey = fallbackApiKey;
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add your API key in Settings." },
        { status: 400 }
      );
    }

    // Fetch recent news for the coin
    const newsResponse = await fetch(
      `${request.nextUrl.origin}/api/crypto/news/${coinId}?days=3`,
      { next: { revalidate: 300 } }
    );

    let newsData = { articles: [] };
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
    }

    // Fetch current coin data
    const coinResponse = await fetch(
      `${request.nextUrl.origin}/api/crypto/coin/${coinId}?days=7`,
      { next: { revalidate: 300 } }
    );

    let coinData: any = {};
    if (coinResponse.ok) {
      coinData = await coinResponse.json();
    }

    // Prepare context for AI analysis
    const newsHeadlines = newsData.articles
      ?.slice(0, 5)
      .map((article: any) => `- ${article.title} (${article.sentiment})`)
      .join('\n') || 'No recent news available';

    const currentPrice = coinData.current_price || 0;
    const priceChange24h = coinData.price_change_percentage_24h || 0;
    const priceChange7d = coinData.price_change_percentage_7d || 0;
    const volume24h = coinData.total_volume || 0;
    const marketCap = coinData.market_cap || 0;

    // Create AI prompt
    const prompt = `You are a professional cryptocurrency analyst. Analyze the following data for ${coinId.toUpperCase()} and provide a price prediction:

CURRENT MARKET DATA:
- Current Price: $${currentPrice.toFixed(2)}
- 24h Change: ${priceChange24h.toFixed(2)}%
- 7d Change: ${priceChange7d.toFixed(2)}%
- 24h Volume: $${volume24h.toLocaleString()}
- Market Cap: $${marketCap.toLocaleString()}

RECENT NEWS HEADLINES (Past 3 days):
${newsHeadlines}

Please provide:
1. Price prediction: "bullish", "bearish", or "neutral"
2. Confidence level: 0-100%
3. Brief reasoning (max 200 words)
4. Key factors influencing your prediction
5. Timeframe: Next 7 days

Format your response as JSON:
{
  "prediction": "bullish|bearish|neutral",
  "confidence": 75,
  "reasoning": "Your analysis here...",
  "factors": {
    "technical": 70,
    "sentiment": 80,
    "fundamental": 65
  },
  "timeframe": "7 days",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}

Focus on data-driven analysis and acknowledge uncertainty where appropriate.`;

    // Call OpenAI API
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional cryptocurrency analyst providing objective, data-driven predictions. Always format responses as valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        
        if (openaiResponse.status === 401) {
          return NextResponse.json(
            { error: "Invalid OpenAI API key. Please check your API key in Settings." },
            { status: 400 }
          );
        }
        
        if (openaiResponse.status === 429) {
          return NextResponse.json(
            { error: "OpenAI API rate limit exceeded. Please try again later." },
            { status: 429 }
          );
        }

        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const aiResult = await openaiResponse.json();
      const aiContent = aiResult.choices?.[0]?.message?.content;

      if (!aiContent) {
        throw new Error("No response from AI");
      }

      // Parse AI response
      let predictionData;
      try {
        predictionData = JSON.parse(aiContent);
      } catch (parseError) {
        // If JSON parsing fails, create a fallback response
        predictionData = {
          prediction: "neutral",
          confidence: 50,
          reasoning: "Unable to parse AI response. Analysis based on limited data suggests neutral outlook.",
          factors: { technical: 50, sentiment: 50, fundamental: 50 },
          timeframe: "7 days",
          keyPoints: ["Limited data available", "Market volatility", "Uncertain conditions"]
        };
      }

      // Add metadata
      const response = {
        ...predictionData,
        coinId,
        generatedAt: new Date().toISOString(),
        dataSource: {
          newsArticles: newsData.articles?.length || 0,
          priceData: !!coinData.current_price,
          marketData: {
            price: currentPrice,
            change24h: priceChange24h,
            change7d: priceChange7d
          }
        }
      };

      return NextResponse.json(response);

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      
      // Return a fallback prediction based on technical data
      const fallbackPrediction = generateFallbackPrediction(
        coinId,
        priceChange24h,
        priceChange7d,
        newsData.articles || []
      );

      return NextResponse.json(fallbackPrediction);
    }

  } catch (error) {
    console.error("Error generating prediction:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}

function generateFallbackPrediction(
  coinId: string,
  change24h: number,
  change7d: number,
  articles: any[]
): any {
  const sentimentCounts = articles.reduce(
    (acc, article) => {
      acc[article.sentiment || "neutral"]++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const totalArticles = articles.length;
  const positiveRatio = totalArticles > 0 ? sentimentCounts.positive / totalArticles : 0.5;
  const negativeRatio = totalArticles > 0 ? sentimentCounts.negative / totalArticles : 0.5;

  // Simple heuristic based on price changes and sentiment
  let prediction = "neutral";
  let confidence = 50;

  if (change24h > 5 && change7d > 10 && positiveRatio > 0.6) {
    prediction = "bullish";
    confidence = 75;
  } else if (change24h < -5 && change7d < -10 && negativeRatio > 0.6) {
    prediction = "bearish";
    confidence = 75;
  } else if (change24h > 2 || positiveRatio > 0.7) {
    prediction = "bullish";
    confidence = 60;
  } else if (change24h < -2 || negativeRatio > 0.7) {
    prediction = "bearish";
    confidence = 60;
  }

  return {
    prediction,
    confidence,
    reasoning: `Technical analysis based on ${change24h.toFixed(2)}% 24h change and ${change7d.toFixed(2)}% 7d change. News sentiment: ${positiveRatio > 0.5 ? 'positive' : negativeRatio > 0.5 ? 'negative' : 'neutral'} with ${totalArticles} recent articles analyzed. AI service temporarily unavailable.`,
    factors: {
      technical: Math.max(30, Math.min(70, 50 + change7d)),
      sentiment: Math.max(30, Math.min(70, 50 + (positiveRatio - negativeRatio) * 50)),
      fundamental: 50
    },
    timeframe: "7 days",
    keyPoints: [
      `${change24h > 0 ? 'Positive' : 'Negative'} 24h momentum`,
      `${change7d > 0 ? 'Bullish' : 'Bearish'} weekly trend`,
      `${positiveRatio > 0.5 ? 'Positive' : 'Mixed'} news sentiment`
    ],
    coinId,
    generatedAt: new Date().toISOString(),
    dataSource: {
      newsArticles: totalArticles,
      priceData: true,
      marketData: {
        price: 0,
        change24h,
        change7d
      }
    },
    fallback: true
  };
}
