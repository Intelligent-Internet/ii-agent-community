import { useState, useEffect } from "react";
import { NewsArticle } from "@/types/crypto";

interface UseCoinNewsOptions {
  coinId: string;
  days?: number;
  refreshInterval?: number;
}

interface UseCoinNewsReturn {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  totalResults: number;
}

export function useCoinNews({
  coinId,
  days = 3,
  refreshInterval = 300000, // 5 minutes
}: UseCoinNewsOptions): UseCoinNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const fetchNews = async () => {
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        days: days.toString(),
      });

      const response = await fetch(`/api/crypto/news/${coinId}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setArticles(data.articles || []);
        setTotalResults(data.totalResults || 0);
      } else {
        throw new Error("Failed to fetch news data");
      }
    } catch (err) {
      console.error("Error fetching coin news:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch news");
      // Set empty array instead of keeping old data on error
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchNews();
  };

  useEffect(() => {
    if (coinId) {
      fetchNews();
    }
  }, [coinId, days]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchNews();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, loading, coinId, days]);

  return { articles, loading, error, refetch, totalResults };
}