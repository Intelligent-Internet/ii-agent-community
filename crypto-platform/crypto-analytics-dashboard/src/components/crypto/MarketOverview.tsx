"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCryptoData } from "@/hooks/useCryptoData";
import CoinCard from "./CoinCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  Filter,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { toast } from "sonner";

interface MarketOverviewProps {
  title?: string;
  showControls?: boolean;
  defaultLimit?: number;
  showHeader?: boolean;
}

export default function MarketOverview({
  title = "Market Overview",
  showControls = true,
  defaultLimit = 10,
  showHeader = true,
}: MarketOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("market_cap_desc");
  const [limit, setLimit] = useState(defaultLimit);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crypto-watchlist");
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading watchlist:", error);
    }
  }, []);

  const {
    data: coins,
    loading,
    error,
    refetch,
    lastUpdated,
  } = useCryptoData({
    vs_currency: "usd",
    order: sortOrder,
    per_page: limit,
    page: 1,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  // Filter coins based on search term
  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Market data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const toggleWatchlist = (coinId: string) => {
    try {
      const newWatchlist = watchlist.includes(coinId)
        ? watchlist.filter((id) => id !== coinId)
        : [...watchlist, coinId];

      setWatchlist(newWatchlist);
      localStorage.setItem("crypto-watchlist", JSON.stringify(newWatchlist));

      toast.success(
        watchlist.includes(coinId)
          ? "Removed from watchlist"
          : "Added to watchlist"
      );
    } catch (error) {
      toast.error("Failed to update watchlist");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (error) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span>Failed to load market data: {error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="text-blue-500" size={24} />
                  <span>{title}</span>
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Top cryptocurrencies by market cap
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Activity size={16} className="text-green-500" />
                <span>Live Data</span>
                {lastUpdated && (
                  <>
                    <Clock size={16} />
                    <span>Updated {formatRelativeTime(lastUpdated)}</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          {showControls && (
            <CardContent className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      placeholder="Search cryptocurrencies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
                    <Filter size={16} className="mr-2 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="market_cap_desc">Market Cap ↓</SelectItem>
                    <SelectItem value="market_cap_asc">Market Cap ↑</SelectItem>
                    <SelectItem value="volume_desc">Volume ↓</SelectItem>
                    <SelectItem value="volume_asc">Volume ↑</SelectItem>
                    <SelectItem value="id_asc">Name A-Z</SelectItem>
                    <SelectItem value="id_desc">Name Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                  <SelectTrigger className="w-full sm:w-32 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="10">10 coins</SelectItem>
                    <SelectItem value="25">25 coins</SelectItem>
                    <SelectItem value="50">50 coins</SelectItem>
                    <SelectItem value="100">100 coins</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="icon"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  disabled={loading}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Market Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {loading && coins.length === 0 ? (
          // Loading skeletons
          Array.from({ length: defaultLimit }).map((_, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-80 bg-gray-900/50 border-gray-800 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full" />
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-gray-700 rounded" />
                      <div className="w-16 h-3 bg-gray-700 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-32 h-6 bg-gray-700 rounded" />
                    <div className="w-24 h-4 bg-gray-700 rounded" />
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                          <div className="w-16 h-3 bg-gray-700 rounded" />
                          <div className="w-20 h-4 bg-gray-700 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          filteredCoins.map((coin) => (
            <motion.div key={coin.id} variants={itemVariants}>
              <CoinCard
                coin={coin}
                isInWatchlist={watchlist.includes(coin.id)}
                onToggleWatchlist={toggleWatchlist}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      {filteredCoins.length === 0 && !loading && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-8 text-center">
            <Search size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No cryptocurrencies found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}