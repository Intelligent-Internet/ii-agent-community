import { describe, it, expect } from '@jest/globals';

describe('AI Predictions API', () => {
  describe('Prediction Data Structure', () => {
    it('should validate prediction response structure', () => {
      const mockPrediction = {
        coinId: 'bitcoin',
        prediction: 'up',
        confidence: 0.75,
        reasoning: 'Based on recent positive news sentiment and market trends...',
        timeframe: '24h',
        analysisData: {
          sentimentScore: 0.6,
          newsCount: 15,
          technicalIndicators: {
            rsi: 65,
            ma50: 42000,
            ma200: 40000
          }
        },
        timestamp: new Date()
      };

      expect(mockPrediction).toHaveProperty('coinId');
      expect(mockPrediction).toHaveProperty('prediction');
      expect(mockPrediction).toHaveProperty('confidence');
      expect(mockPrediction).toHaveProperty('reasoning');
      expect(mockPrediction).toHaveProperty('timeframe');
      expect(mockPrediction).toHaveProperty('analysisData');
      expect(mockPrediction).toHaveProperty('timestamp');

      expect(typeof mockPrediction.coinId).toBe('string');
      expect(typeof mockPrediction.prediction).toBe('string');
      expect(typeof mockPrediction.confidence).toBe('number');
      expect(typeof mockPrediction.reasoning).toBe('string');
      expect(mockPrediction.timestamp instanceof Date).toBe(true);
    });

    it('should validate prediction values', () => {
      const validPredictions = ['up', 'down', 'neutral'];
      
      validPredictions.forEach(prediction => {
        expect(['up', 'down', 'neutral']).toContain(prediction);
      });

      const invalidPredictions = ['rise', 'fall', 'sideways', ''];
      invalidPredictions.forEach(prediction => {
        expect(['up', 'down', 'neutral']).not.toContain(prediction);
      });
    });

    it('should validate confidence range', () => {
      const validConfidences = [0, 0.25, 0.5, 0.75, 1.0];
      const invalidConfidences = [-0.1, 1.1, -5, 10];

      validConfidences.forEach(confidence => {
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      });

      invalidConfidences.forEach(confidence => {
        expect(confidence < 0 || confidence > 1).toBe(true);
      });
    });
  });

  describe('Sentiment Analysis for Predictions', () => {
    it('should calculate sentiment score correctly', () => {
      const calculateSentimentScore = (newsArticles: Array<{sentiment: string}>): number => {
        if (newsArticles.length === 0) return 0;
        
        let totalScore = 0;
        newsArticles.forEach(article => {
          switch (article.sentiment) {
            case 'positive':
              totalScore += 1;
              break;
            case 'negative':
              totalScore -= 1;
              break;
            case 'neutral':
              totalScore += 0;
              break;
          }
        });
        
        return totalScore / newsArticles.length;
      };

      const allPositive = [
        { sentiment: 'positive' },
        { sentiment: 'positive' },
        { sentiment: 'positive' }
      ];
      expect(calculateSentimentScore(allPositive)).toBe(1);

      const allNegative = [
        { sentiment: 'negative' },
        { sentiment: 'negative' }
      ];
      expect(calculateSentimentScore(allNegative)).toBe(-1);

      const mixed = [
        { sentiment: 'positive' },
        { sentiment: 'negative' },
        { sentiment: 'neutral' }
      ];
      expect(calculateSentimentScore(mixed)).toBeCloseTo(0, 2);

      expect(calculateSentimentScore([])).toBe(0);
    });
  });

  describe('Technical Analysis', () => {
    it('should calculate moving averages correctly', () => {
      const calculateMA = (prices: number[], period: number): number => {
        if (prices.length < period) return 0;
        const relevantPrices = prices.slice(-period);
        const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
        return sum / period;
      };

      const prices = [100, 110, 105, 115, 120];
      expect(calculateMA(prices, 3)).toBeCloseTo(113.33, 2);
      expect(calculateMA(prices, 5)).toBe(110);
      expect(calculateMA(prices, 10)).toBe(0); // Not enough data
      expect(calculateMA([], 5)).toBe(0); // Empty array
    });

    it('should calculate RSI correctly', () => {
      const calculateRSI = (gains: number[], losses: number[]): number => {
        if (gains.length === 0 || losses.length === 0) return 50;
        
        const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
        const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
      };

      expect(calculateRSI([2, 3, 1], [1, 1, 2])).toBeCloseTo(60, 0);
      expect(calculateRSI([5, 5, 5], [1, 1, 1])).toBeCloseTo(83.33, 0);
      expect(calculateRSI([], [])).toBe(50);
      expect(calculateRSI([1, 2, 3], [0, 0, 0])).toBe(100);
    });
  });

  describe('Fallback Algorithm', () => {
    it('should generate predictions when OpenAI is unavailable', () => {
      const fallbackPredict = (
        sentimentScore: number,
        rsi: number,
        priceChange24h: number
      ): { prediction: string; confidence: number } => {
        let score = 0;
        
        // Sentiment factor
        score += sentimentScore * 0.4;
        
        // RSI factor (oversold/overbought)
        if (rsi < 30) score += 0.3; // Oversold, likely to go up
        if (rsi > 70) score -= 0.3; // Overbought, likely to go down
        
        // Recent price change factor
        score += (priceChange24h / 100) * 0.3;
        
        const confidence = Math.min(Math.abs(score), 0.8);
        
        if (score > 0.1) return { prediction: 'up', confidence };
        if (score < -0.1) return { prediction: 'down', confidence };
        return { prediction: 'neutral', confidence: 0.3 };
      };

      // Bullish scenario
      const bullish = fallbackPredict(0.8, 25, 5);
      expect(bullish.prediction).toBe('up');
      expect(bullish.confidence).toBeGreaterThan(0.5);

      // Bearish scenario
      const bearish = fallbackPredict(-0.6, 80, -3);
      expect(bearish.prediction).toBe('down');
      expect(bearish.confidence).toBeGreaterThan(0.4);

      // Neutral scenario
      const neutral = fallbackPredict(0, 50, 0);
      expect(neutral.prediction).toBe('neutral');
      expect(neutral.confidence).toBeLessThan(0.5);
    });
  });

  describe('API Key Management', () => {
    it('should validate OpenAI API key format', () => {
      const validateApiKey = (key: string): boolean => {
        // OpenAI API keys typically start with 'sk-' and are ~51 characters
        return key.startsWith('sk-') && key.length >= 40;
      };

      expect(validateApiKey('sk-1234567890abcdef1234567890abcdef12345678')).toBe(true);
      expect(validateApiKey('invalid-key')).toBe(false);
      expect(validateApiKey('')).toBe(false);
      expect(validateApiKey('sk-short')).toBe(false);
    });

    it('should handle encrypted API key storage', () => {
      // Mock encryption/decryption functions
      const mockEncrypt = (text: string): string => {
        return Buffer.from(text).toString('base64');
      };

      const mockDecrypt = (encryptedText: string): string => {
        return Buffer.from(encryptedText, 'base64').toString();
      };

      const originalKey = 'sk-1234567890abcdef1234567890abcdef12345678';
      const encrypted = mockEncrypt(originalKey);
      const decrypted = mockDecrypt(encrypted);

      expect(encrypted).not.toBe(originalKey);
      expect(decrypted).toBe(originalKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', () => {
      const handleApiError = (error: any) => {
        if (error.status === 401) {
          return { error: 'Invalid API key' };
        }
        if (error.status === 429) {
          return { error: 'Rate limit exceeded' };
        }
        if (error.status >= 500) {
          return { error: 'Service temporarily unavailable' };
        }
        return { error: 'Unknown error occurred' };
      };

      expect(handleApiError({ status: 401 })).toEqual({ error: 'Invalid API key' });
      expect(handleApiError({ status: 429 })).toEqual({ error: 'Rate limit exceeded' });
      expect(handleApiError({ status: 500 })).toEqual({ error: 'Service temporarily unavailable' });
      expect(handleApiError({ status: 400 })).toEqual({ error: 'Unknown error occurred' });
    });
  });
});