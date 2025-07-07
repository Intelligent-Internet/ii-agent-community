"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Calendar, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { useCoinNews } from "@/hooks/useCoinNews";
import { NewsArticle } from "@/types/crypto";
import { formatRelativeTime } from "@/lib/formatters";

interface NewsSectionProps {
  coinId: string;
  coinName: string;
  className?: string;
}

export function NewsSection({ coinId, coinName, className = "" }: NewsSectionProps) {
  const [selectedDays, setSelectedDays] = useState(3);
  const { articles, loading, error, refetch, totalResults } = useCoinNews({
    coinId,
    days: selectedDays,
  });

  const dayOptions = [
    { label: "1 Day", value: 1 },
    { label: "3 Days", value: 3 },
    { label: "7 Days", value: 7 },
  ];

  const sentimentStats = articles.reduce(
    (acc, article) => {
      acc[article.sentiment || "neutral"]++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-500";
      case "negative": return "text-red-500";
      default: return "text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="w-3 h-3" />;
      case "negative": return <TrendingDown className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-500/10 border-green-500/20";
      case "negative": return "bg-red-500/10 border-red-500/20";
      default: return "bg-gray-500/10 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-48 h-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-16 bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">News Unavailable</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent News</h3>
        <button
          onClick={refetch}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh news"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Time period selector */}
      <div className="flex gap-2 mb-6">
        {dayOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedDays(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDays === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Sentiment Summary */}
      {articles.length > 0 && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">News Sentiment</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">Positive:</span>
              <span className="text-sm font-semibold text-green-500">
                {sentimentStats.positive}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-400">Negative:</span>
              <span className="text-sm font-semibold text-red-500">
                {sentimentStats.negative}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Neutral:</span>
              <span className="text-sm font-semibold text-gray-400">
                {sentimentStats.neutral}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h4 className="text-lg font-medium mb-2">No Recent News</h4>
          <p className="text-gray-400">
            No news articles found for {coinName} in the past {selectedDays} day{selectedDays !== 1 ? 's' : ''}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Footer */}
      {articles.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Showing {articles.length} of {totalResults} articles from the past {selectedDays} day{selectedDays !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

interface NewsCardProps {
  article: NewsArticle;
}

function NewsCard({ article }: NewsCardProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-500";
      case "negative": return "text-red-500";
      default: return "text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="w-3 h-3" />;
      case "negative": return <TrendingDown className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-500/10 border-green-500/20";
      case "negative": return "bg-red-500/10 border-red-500/20";
      default: return "bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <article className="group hover:bg-gray-700/50 rounded-lg p-4 transition-colors cursor-pointer">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex gap-4">
          {/* Article Image */}
          {article.urlToImage && (
            <div className="flex-shrink-0">
              <Image
                src={article.urlToImage}
                alt=""
                width={80}
                height={60}
                className="rounded-lg object-cover w-20 h-15"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h4>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>

            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {article.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-medium">{article.source.name}</span>
                <span>•</span>
                <span>{formatRelativeTime(article.publishedAt)}</span>
              </div>

              {/* Sentiment Badge */}
              {article.sentiment && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getSentimentBgColor(article.sentiment)} ${getSentimentColor(article.sentiment)}`}>
                  {getSentimentIcon(article.sentiment)}
                  <span className="capitalize">{article.sentiment}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </a>
    </article>
  );
}