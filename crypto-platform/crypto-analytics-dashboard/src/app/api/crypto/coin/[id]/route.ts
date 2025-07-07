import { NextRequest, NextResponse } from "next/server";

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") || "7";
    const vs_currency = searchParams.get("vs_currency") || "usd";

    // Fetch coin details
    const coinDetailsUrl = `${COINGECKO_API_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    
    // Fetch historical price data
    const historicalUrl = `${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}&interval=${days === "1" ? "hourly" : "daily"}`;

    console.log(`Fetching coin details for ${id} with ${days} days`);
    console.log(`Coin details URL: ${coinDetailsUrl}`);
    console.log(`Historical data URL: ${historicalUrl}`);

    const [coinDetailsResponse, historicalResponse] = await Promise.all([
      fetch(coinDetailsUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 } // Cache for 5 minutes
      }),
      fetch(historicalUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 } // Cache for 5 minutes
      })
    ]);

    console.log(`Coin details response status: ${coinDetailsResponse.status}`);
    console.log(`Historical response status: ${historicalResponse.status}`);

    if (!coinDetailsResponse.ok) {
      console.error(`Failed to fetch coin details: ${coinDetailsResponse.status} ${coinDetailsResponse.statusText}`);
      throw new Error(`Failed to fetch coin details: ${coinDetailsResponse.status}`);
    }

    const coinDetails = await coinDetailsResponse.json();
    let historicalData = { prices: [], market_caps: [], total_volumes: [] };

    if (historicalResponse.ok) {
      historicalData = await historicalResponse.json();
    } else {
      console.warn(`Failed to fetch historical data: ${historicalResponse.status} ${historicalResponse.statusText}`);
    }

    // Transform the data to match our application format
    const transformedData = {
      id: coinDetails.id,
      symbol: coinDetails.symbol?.toUpperCase(),
      name: coinDetails.name,
      image: coinDetails.image?.large,
      current_price: coinDetails.market_data?.current_price?.[vs_currency],
      market_cap: coinDetails.market_data?.market_cap?.[vs_currency],
      market_cap_rank: coinDetails.market_cap_rank,
      total_volume: coinDetails.market_data?.total_volume?.[vs_currency],
      high_24h: coinDetails.market_data?.high_24h?.[vs_currency],
      low_24h: coinDetails.market_data?.low_24h?.[vs_currency],
      price_change_24h: coinDetails.market_data?.price_change_24h,
      price_change_percentage_24h: coinDetails.market_data?.price_change_percentage_24h,
      price_change_percentage_7d: coinDetails.market_data?.price_change_percentage_7d,
      price_change_percentage_30d: coinDetails.market_data?.price_change_percentage_30d,
      circulating_supply: coinDetails.market_data?.circulating_supply,
      total_supply: coinDetails.market_data?.total_supply,
      max_supply: coinDetails.market_data?.max_supply,
      ath: coinDetails.market_data?.ath?.[vs_currency],
      ath_change_percentage: coinDetails.market_data?.ath_change_percentage?.[vs_currency],
      ath_date: coinDetails.market_data?.ath_date?.[vs_currency],
      atl: coinDetails.market_data?.atl?.[vs_currency],
      atl_change_percentage: coinDetails.market_data?.atl_change_percentage?.[vs_currency],
      atl_date: coinDetails.market_data?.atl_date?.[vs_currency],
      description: coinDetails.description?.en,
      homepage: coinDetails.links?.homepage?.[0],
      blockchain_site: coinDetails.links?.blockchain_site?.filter(Boolean),
      official_forum_url: coinDetails.links?.official_forum_url?.filter(Boolean),
      chat_url: coinDetails.links?.chat_url?.filter(Boolean),
      announcement_url: coinDetails.links?.announcement_url?.filter(Boolean),
      twitter_screen_name: coinDetails.links?.twitter_screen_name,
      facebook_username: coinDetails.links?.facebook_username,
      bitcointalk_thread_identifier: coinDetails.links?.bitcointalk_thread_identifier,
      telegram_channel_identifier: coinDetails.links?.telegram_channel_identifier,
      subreddit_url: coinDetails.links?.subreddit_url,
      repos_url: coinDetails.links?.repos_url,
      
      // Historical price data
      price_chart_data: {
        prices: historicalData.prices?.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          date: new Date(timestamp),
          price
        })) || [],
        market_caps: historicalData.market_caps?.map(([timestamp, market_cap]: [number, number]) => ({
          timestamp,
          date: new Date(timestamp),
          market_cap
        })) || [],
        total_volumes: historicalData.total_volumes?.map(([timestamp, volume]: [number, number]) => ({
          timestamp,
          date: new Date(timestamp),
          volume
        })) || []
      }
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching coin data:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin data" },
      { status: 500 }
    );
  }
}