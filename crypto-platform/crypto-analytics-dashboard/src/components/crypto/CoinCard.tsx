"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CryptoCoin } from "@/types/crypto";
import {
  formatCurrency,
  formatPercentage,
  formatMarketCap,
  formatVolume,
  getChangeColor,
  getChangeBgColor,
} from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";

interface CoinCardProps {
  coin: CryptoCoin;
  onClick?: () => void;
  showAddToWatchlist?: boolean;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (coinId: string) => void;
}

export default function CoinCard({
  coin,
  onClick,
  showAddToWatchlist = true,
  isInWatchlist = false,
  onToggleWatchlist,
}: CoinCardProps) {
  const isPositive = coin.price_change_percentage_24h > 0;
  const isNegative = coin.price_change_percentage_24h < 0;

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWatchlist?.(coin.id);
  };

  const cardContent = (
    <Card className="h-full bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image
                src={coin.image}
                alt={`${coin.name} logo`}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="absolute -top-1 -right-1 bg-gray-800 text-xs px-1.5 py-0.5 rounded-full text-gray-400 font-medium">
                #{coin.market_cap_rank}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{coin.name}</h3>
              <p className="text-gray-400 text-sm uppercase">{coin.symbol}</p>
            </div>
          </div>

          {showAddToWatchlist && (
            <button
              onClick={handleWatchlistToggle}
              className={`p-2 rounded-full transition-colors ${
                isInWatchlist
                  ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-500"
              }`}
              title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Star size={16} fill={isInWatchlist ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(coin.current_price)}
            </span>
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${getChangeBgColor(
                coin.price_change_percentage_24h
              )}`}
            >
              {isPositive && <TrendingUp size={14} />}
              {isNegative && <TrendingDown size={14} />}
              {!isPositive && !isNegative && <Minus size={14} />}
              <span>
                {formatPercentage(coin.price_change_percentage_24h)}
              </span>
            </div>
          </div>
          <p className={`text-sm ${getChangeColor(coin.price_change_24h)}`}>
            {isPositive ? "+" : ""}
            {formatCurrency(coin.price_change_24h)} (24h)
          </p>
        </div>

        {/* Market Data */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Market Cap</p>
            <p className="text-white font-medium">
              {formatMarketCap(coin.market_cap)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Volume (24h)</p>
            <p className="text-white font-medium">
              {formatVolume(coin.total_volume)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">High (24h)</p>
            <p className="text-white font-medium">
              {formatCurrency(coin.high_24h)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Low (24h)</p>
            <p className="text-white font-medium">
              {formatCurrency(coin.low_24h)}
            </p>
          </div>
        </div>

        {/* Supply Info */}
        {coin.circulating_supply && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Circulating Supply</span>
              <span className="text-white">
                {formatCurrency(coin.circulating_supply, "USD", "en-US", {
                  style: "decimal",
                  notation: "compact",
                  compactDisplay: "short",
                })} {coin.symbol}
              </span>
            </div>
            {coin.max_supply && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress to Max Supply</span>
                  <span>
                    {((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(coin.circulating_supply / coin.max_supply) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer"
        onClick={onClick}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <Link href={`/coin/${coin.id}`} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer"
      >
        {cardContent}
      </motion.div>
    </Link>
  );
}