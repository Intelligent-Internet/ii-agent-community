"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Activity, Brain, Star, ArrowUpRight, Globe } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MarketOverview from "@/components/crypto/MarketOverview";
import { useCryptoData } from "@/hooks/useCryptoData";
import { formatCurrency, formatPercentage, formatMarketCap } from "@/lib/formatters";
import Link from "next/link";

export default function DashboardPage() {
  // Get top 3 coins for quick overview
  const { data: topCoins, loading: topCoinsLoading } = useCryptoData({
    per_page: 3,
    page: 1,
  });

  // Calculate total market cap of top 3 for portfolio simulation
  const totalMarketCap = topCoins.reduce((sum, coin) => sum + coin.market_cap, 0);
  const simulatedPortfolioValue = totalMarketCap * 0.000001; // Simulate a small portfolio

  const stats = [
    {
      title: "Portfolio Value",
      value: formatCurrency(simulatedPortfolioValue),
      change: topCoins.length > 0 ? formatPercentage(topCoins[0].price_change_percentage_24h) : "+0.00%",
      icon: DollarSign,
      trend: (topCoins.length > 0 && topCoins[0].price_change_percentage_24h > 0) ? "up" : "down",
    },
    {
      title: "Active Predictions",
      value: "23",
      change: "5 this week",
      icon: Brain,
      trend: "neutral",
    },
    {
      title: "Watchlist",
      value: "15",
      change: "3 added today",
      icon: Star,
      trend: "up",
    },
    {
      title: "Market Activity",
      value: "High",
      change: "Active trading",
      icon: Activity,
      trend: "up",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your crypto analytics overview.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.trend === "up" ? "text-green-600" : 
                  stat.trend === "down" ? "text-red-600" : 
                  "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Top Cryptocurrencies</span>
              </CardTitle>
              <CardDescription>
                Live market data from CoinGecko
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCoinsLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border animate-pulse"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="space-y-2">
                          <div className="w-20 h-4 bg-muted rounded" />
                          <div className="w-12 h-3 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="w-20 h-4 bg-muted rounded ml-auto" />
                        <div className="w-16 h-3 bg-muted rounded ml-auto" />
                      </div>
                    </div>
                  ))
                ) : (
                  topCoins.map((coin, index) => (
                    <motion.div
                      key={coin.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Link href={`/coin/${coin.id}`} className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={coin.image}
                                alt={coin.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div className="absolute -top-1 -right-1 bg-background text-xs px-1 rounded-full text-muted-foreground border">
                                #{coin.market_cap_rank}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{coin.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {coin.symbol}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(coin.current_price)}
                            </div>
                            <div className="flex items-center space-x-1">
                              {coin.price_change_percentage_24h > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-sm ${
                                coin.price_change_percentage_24h > 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {formatPercentage(coin.price_change_percentage_24h)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
                <div className="pt-4 border-t">
                  <Link href="/market">
                    <Button variant="outline" className="w-full">
                      <Globe className="w-4 h-4 mr-2" />
                      View Full Market
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with crypto analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/settings">
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Brain className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="font-medium">Setup AI Predictions</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your OpenAI API key to enable AI-powered analysis
                    </p>
                  </div>
                </Link>
                <Link href="/market">
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Star className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="font-medium">Build Watchlist</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your favorite cryptocurrencies to track them closely
                    </p>
                  </div>
                </Link>
                <Link href="/market">
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="font-medium">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Explore detailed charts and market analysis
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Full Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <MarketOverview 
            title="Market Overview" 
            defaultLimit={8}
            showControls={false}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}