import { useState, useEffect } from "react";
import { CoinDetails } from "@/types/crypto";

interface UseCoinDetailsOptions {
  coinId: string;
  days?: string;
  vs_currency?: string;
  refreshInterval?: number;
}

interface UseCoinDetailsReturn {
  data: CoinDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCoinDetails({
  coinId,
  days = "7",
  vs_currency = "usd",
  refreshInterval = 60000, // 1 minute
}: UseCoinDetailsOptions): UseCoinDetailsReturn {
  const [data, setData] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoinDetails = async () => {
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        days,
        vs_currency,
      });

      const response = await fetch(`/api/crypto/coin/${coinId}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch coin details: ${response.status}`);
      }

      const coinData = await response.json();
      
      // Convert date strings to Date objects for chart data
      if (coinData.price_chart_data) {
        coinData.price_chart_data.prices = coinData.price_chart_data.prices.map((point: any) => ({
          ...point,
          date: new Date(point.timestamp)
        }));
        coinData.price_chart_data.market_caps = coinData.price_chart_data.market_caps.map((point: any) => ({
          ...point,
          date: new Date(point.timestamp)
        }));
        coinData.price_chart_data.total_volumes = coinData.price_chart_data.total_volumes.map((point: any) => ({
          ...point,
          date: new Date(point.timestamp)
        }));
      }

      setData(coinData);
    } catch (err) {
      console.error("Error fetching coin details:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch coin details");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchCoinDetails();
  };

  useEffect(() => {
    if (coinId) {
      fetchCoinDetails();
    }
  }, [coinId, days, vs_currency]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchCoinDetails();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, loading, coinId, days, vs_currency]);

  return { data, loading, error, refetch };
}