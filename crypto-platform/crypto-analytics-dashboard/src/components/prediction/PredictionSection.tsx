"use client";

import { useState } from "react";
import { Brain, TrendingUp, TrendingDown, BarChart3, Clock, AlertCircle, Sparkles, Settings, Zap } from "lucide-react";
import { usePrediction } from "@/hooks/usePrediction";
import { formatRelativeTime } from "@/lib/formatters";
import Link from "next/link";

interface PredictionSectionProps {
  coinId: string;
  coinName: string;
  className?: string;
}

export function PredictionSection({ coinId, coinName, className = "" }: PredictionSectionProps) {
  const { prediction, loading, error, generatePrediction } = usePrediction({ coinId });

  const getPredictionColor = (pred: string) => {
    switch (pred) {
      case "bullish": return "text-green-500";
      case "bearish": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  const getPredictionBgColor = (pred: string) => {
    switch (pred) {
      case "bullish": return "bg-green-500/10 border-green-500/20";
      case "bearish": return "bg-red-500/10 border-red-500/20";
      default: return "bg-yellow-500/10 border-yellow-500/20";
    }
  };

  const getPredictionIcon = (pred: string) => {
    switch (pred) {
      case "bullish": return <TrendingUp className="w-5 h-5" />;
      case "bearish": return <TrendingDown className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "text-green-500";
    if (confidence >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Price Prediction</h3>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        
        {!prediction && !loading && !error && (
          <Link
            href="/settings"
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Setup API Key
          </Link>
        )}
      </div>

      {/* Content */}
      {!prediction && !loading && !error ? (
        // Initial state
        <div className="text-center py-8">
          <div className="mb-4">
            <Zap className="w-16 h-16 text-purple-500 mx-auto mb-3" />
            <h4 className="text-xl font-semibold mb-2">AI-Powered Market Analysis</h4>
            <p className="text-gray-400 mb-6">
              Get intelligent price predictions for {coinName} based on news sentiment, 
              technical indicators, and market data.
            </p>
          </div>

          <button
            onClick={generatePrediction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Brain className="w-5 h-5" />
            Generate AI Prediction
          </button>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong className="text-purple-400">How it works:</strong> Our AI analyzes recent news sentiment, 
              technical indicators, trading volume, and market trends to generate data-driven predictions.
            </p>
          </div>
        </div>
      ) : loading ? (
        // Loading state
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <Brain className="w-8 h-8 text-purple-500 animate-pulse" />
          </div>
          <h4 className="text-lg font-medium mb-2">Analyzing Market Data...</h4>
          <p className="text-gray-400 mb-4">
            AI is processing news sentiment, technical indicators, and market trends
          </p>
          <div className="w-48 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h4 className="text-lg font-medium mb-2">Prediction Unavailable</h4>
          <p className="text-gray-400 mb-6">{error}</p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={generatePrediction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/settings"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Check Settings
            </Link>
          </div>
        </div>
      ) : prediction ? (
        // Prediction results
        <div className="space-y-6">
          {/* Main prediction */}
          <div className={`p-6 rounded-lg border ${getPredictionBgColor(prediction.prediction)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getPredictionBgColor(prediction.prediction)}`}>
                  {getPredictionIcon(prediction.prediction)}
                </div>
                <div>
                  <h4 className={`text-xl font-bold capitalize ${getPredictionColor(prediction.prediction)}`}>
                    {prediction.prediction}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {prediction.timeframe} outlook
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence}%
                </div>
                <p className="text-sm text-gray-400">Confidence</p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">
              {prediction.reasoning}
            </p>
          </div>

          {/* Factor breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-400">
                {prediction.factors.technical}%
              </div>
              <div className="text-sm text-gray-400">Technical</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.factors.technical}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-400">
                {prediction.factors.sentiment}%
              </div>
              <div className="text-sm text-gray-400">Sentiment</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.factors.sentiment}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                {prediction.factors.fundamental}%
              </div>
              <div className="text-sm text-gray-400">Fundamental</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.factors.fundamental}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Key points */}
          {prediction.keyPoints && prediction.keyPoints.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Key Analysis Points:</h5>
              <ul className="space-y-2">
                {prediction.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              Generated {formatRelativeTime(prediction.generatedAt)}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={generatePrediction}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Data source info */}
          {prediction.dataSource && (
            <div className="text-xs text-gray-500">
              Analysis based on {prediction.dataSource.newsArticles} news articles, 
              price data, and technical indicators.
              {prediction.fallback && " (Fallback analysis - AI service temporarily unavailable)"}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}