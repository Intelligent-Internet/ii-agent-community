import { useState } from "react";
import { PredictionResult } from "@/types/crypto";

interface UsePredictionOptions {
  coinId: string;
}

interface UsePredictionReturn {
  prediction: PredictionResult | null;
  loading: boolean;
  error: string | null;
  generatePrediction: () => void;
}

export function usePrediction({ coinId }: UsePredictionOptions): UsePredictionReturn {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crypto/predict/${coinId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const predictionData = await response.json();
      setPrediction(predictionData);
    } catch (err) {
      console.error("Error generating prediction:", err);
      setError(err instanceof Error ? err.message : "Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };

  return { prediction, loading, error, generatePrediction };
}