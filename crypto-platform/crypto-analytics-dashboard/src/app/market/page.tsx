"use client";

import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MarketOverview from "@/components/crypto/MarketOverview";

export default function MarketPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Cryptocurrency Market</h1>
          <p className="text-muted-foreground">
            Explore real-time cryptocurrency prices, market caps, and trends
          </p>
        </motion.div>

        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MarketOverview 
            title="Live Market Data"
            showControls={true}
            defaultLimit={50}
            showHeader={true}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}