"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import { PriceDataPoint } from "@/types/crypto";
import { formatCurrency } from "@/lib/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface PriceChartProps {
  data: PriceDataPoint[];
  symbol: string;
  timeframe: string;
  className?: string;
}

export function PriceChart({ data, symbol, timeframe, className = "" }: PriceChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      // Update gradient
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      
      // Determine gradient colors based on price trend
      const firstPrice = data[0]?.price || 0;
      const lastPrice = data[data.length - 1]?.price || 0;
      const isPositive = lastPrice >= firstPrice;
      
      if (isPositive) {
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)"); // green
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.01)");
      } else {
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.3)"); // red
        gradient.addColorStop(1, "rgba(239, 68, 68, 0.01)");
      }

      chart.data.datasets[0].backgroundColor = gradient;
      chart.update("none");
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-800/50 rounded-lg ${className}`}>
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Determine if price is up or down
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;
  const lineColor = isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

  const chartData = {
    labels: data.map(point => point.date),
    datasets: [
      {
        label: `${symbol} Price`,
        data: data.map(point => point.price),
        borderColor: lineColor,
        backgroundColor: "transparent", // Will be set by gradient effect
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: lineColor,
        pointBorderColor: "#1f2937",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f9fafb",
        bodyColor: "#f9fafb",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          family: "Nunito Sans",
          size: 12,
          weight: "600",
        },
        bodyFont: {
          family: "Nunito Sans",
          size: 14,
          weight: "700",
        },
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return format(date, timeframe === "1" ? "MMM d, HH:mm" : "MMM d, yyyy");
          },
          label: (context: any) => {
            return formatCurrency(context.parsed.y);
          },
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          displayFormats: {
            hour: "HH:mm",
            day: "MMM d",
            week: "MMM d",
            month: "MMM yyyy",
          },
          tooltipFormat: timeframe === "1" ? "MMM d, HH:mm" : "MMM d, yyyy",
        },
        grid: {
          color: "#374151",
          lineWidth: 1,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            family: "Nunito Sans",
            size: 12,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        position: "right" as const,
        grid: {
          color: "#374151",
          lineWidth: 1,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            family: "Nunito Sans",
            size: 12,
          },
          callback: function(value: any) {
            return formatCurrency(value, "USD", { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: value > 1 ? 2 : 6 
            });
          },
        },
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}