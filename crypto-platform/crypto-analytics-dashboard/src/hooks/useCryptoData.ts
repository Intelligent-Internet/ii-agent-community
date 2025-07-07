import { useState, useEffect, useCallback } from "react";
import { CryptoCoin, CryptoApiResponse } from "@/types/crypto";

interface UseCryptoDataOptions {
  vs_currency?: string;
  order?: string;
  per_page?: number;
  page?: number;
  ids?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseCryptoDataReturn {
  data: CryptoCoin[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: string | null;
}

export function useCryptoData(options: UseCryptoDataOptions = {}): UseCryptoDataReturn {
  const {
    vs_currency = "usd",
    order = "market_cap_desc",
    per_page = 10,
    page = 1,
    ids,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [data, setData] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const queryParams = new URLSearchParams({
        vs_currency,
        order,
        per_page: per_page.toString(),
        page: page.toString(),
      });

      if (ids) {
        queryParams.append("ids", ids);
      }

      const response = await fetch(`/api/crypto/markets?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CryptoApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch crypto data");
      }

      setData(result.data);
      setLastUpdated(result.timestamp);
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [vs_currency, order, per_page, page, ids]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading and no error
      if (!loading && !error) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, error, fetchData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}

// Hook for fetching a single coin's data
export function useSingleCoinData(coinId: string) {
  return useCryptoData({
    ids: coinId,
    per_page: 1,
    page: 1,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds for single coin
  });
}

// Hook for fetching specific coins
export function useMultipleCoinData(coinIds: string[]) {
  return useCryptoData({
    ids: coinIds.join(","),
    per_page: coinIds.length,
    page: 1,
    autoRefresh: true,
    refreshInterval: 45000, // 45 seconds for multiple specific coins
  });
}