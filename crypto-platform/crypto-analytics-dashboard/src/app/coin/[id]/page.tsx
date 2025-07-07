"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Star, BarChart3, Clock, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCoinDetails } from "@/hooks/useCoinDetails";
import { PriceChart } from "@/components/charts/PriceChart";
import { NewsSection } from "@/components/news/NewsSection";
import { PredictionSection } from "@/components/prediction/PredictionSection";
import { 
  formatCurrency, 
  formatPercentage, 
  formatMarketCap, 
  formatVolume,
  formatDate,
  getChangeColor,
  getChangeBgColor,
  formatLargeNumber
} from "@/lib/formatters";

const timeframes = [
  { label: "24H", value: "1" },
  { label: "7D", value: "7" },
  { label: "30D", value: "30" },
  { label: "90D", value: "90" },
  { label: "1Y", value: "365" },
];

export default function CoinPage() {
  const params = useParams();
  const coinId = params.id as string;
  const [selectedTimeframe, setSelectedTimeframe] = useState("7");
  
  const { data: coin, loading, error } = useCoinDetails({
    coinId,
    days: selectedTimeframe,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="w-48 h-8 bg-gray-700 rounded"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-800 rounded-lg mb-6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-800 rounded-lg"></div>
                <div className="h-32 bg-gray-800 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Coin Data</h1>
            <p className="text-gray-400 mb-6">{error || "Coin not found"}</p>
            <Link 
              href="/market" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Market
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priceChange24h = coin.price_change_percentage_24h || 0;
  const priceChange7d = coin.price_change_percentage_7d || 0;
  const priceChange30d = coin.price_change_percentage_30d || 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/market" 
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-4">
            <Image 
              src={coin.image} 
              alt={coin.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">{coin.name}</h1>
              <p className="text-gray-400 text-lg">{coin.symbol} • Rank #{coin.market_cap_rank}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2">
            {/* Price and Change */}
            <div className="mb-6">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold">
                  {formatCurrency(coin.current_price)}
                </span>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${getChangeBgColor(priceChange24h)}`}>
                  {priceChange24h >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {formatPercentage(priceChange24h)} (24h)
                  </span>
                </div>
              </div>
              
              {/* Additional timeframe changes */}
              <div className="flex gap-4 text-sm">
                <span className={`${getChangeColor(priceChange7d)}`}>
                  7d: {formatPercentage(priceChange7d)}
                </span>
                <span className={`${getChangeColor(priceChange30d)}`}>
                  30d: {formatPercentage(priceChange30d)}
                </span>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2 mb-6">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe.value}
                  onClick={() => setSelectedTimeframe(timeframe.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedTimeframe === timeframe.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {timeframe.label}
                </button>
              ))}
            </div>

            {/* Price Chart */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Price Chart ({timeframes.find(t => t.value === selectedTimeframe)?.label})</h3>
              </div>
              
              {coin.price_chart_data?.prices && coin.price_chart_data.prices.length > 0 ? (
                <PriceChart
                  data={coin.price_chart_data.prices}
                  symbol={coin.symbol}
                  timeframe={selectedTimeframe}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Market Stats */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Market Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="font-semibold">{formatMarketCap(coin.market_cap)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="font-semibold">{formatVolume(coin.total_volume)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">24h High</span>
                  <span className="font-semibold">{formatCurrency(coin.high_24h)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Low</span>
                  <span className="font-semibold">{formatCurrency(coin.low_24h)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">All-Time High</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(coin.ath)}</div>
                    <div className={`text-sm ${getChangeColor(coin.ath_change_percentage)}`}>
                      {formatPercentage(coin.ath_change_percentage)}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">All-Time Low</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(coin.atl)}</div>
                    <div className={`text-sm ${getChangeColor(coin.atl_change_percentage)}`}>
                      {formatPercentage(coin.atl_change_percentage)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supply Information */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Supply Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Circulating Supply</span>
                  <span className="font-semibold">{formatLargeNumber(coin.circulating_supply)}</span>
                </div>
                
                {coin.total_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Supply</span>
                    <span className="font-semibold">{formatLargeNumber(coin.total_supply)}</span>
                  </div>
                )}
                
                {coin.max_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Supply</span>
                    <span className="font-semibold">{formatLargeNumber(coin.max_supply)}</span>
                  </div>
                )}
                
                {coin.max_supply && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Progress to Max</span>
                      <span className="font-semibold">
                        {((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(coin.circulating_supply / coin.max_supply) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            {(coin.homepage || coin.twitter_screen_name || coin.subreddit_url) && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Links</h3>
                <div className="space-y-3">
                  {coin.homepage && (
                    <a 
                      href={coin.homepage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  
                  {coin.twitter_screen_name && (
                    <a 
                      href={`https://twitter.com/${coin.twitter_screen_name}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>𝕏</span>
                      <span>Twitter</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  
                  {coin.subreddit_url && (
                    <a 
                      href={coin.subreddit_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>📱</span>
                      <span>Reddit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Prediction Section */}
        <PredictionSection 
          coinId={coinId}
          coinName={coin.name}
          className="mt-8"
        />

        {/* News Section */}
        <NewsSection 
          coinId={coinId}
          coinName={coin.name}
          className="mt-8"
        />

        {/* Description */}
        {coin.description && (
          <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">About {coin.name}</h3>
            <div 
              className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: coin.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}