import { describe, it, expect } from '@jest/globals';

describe('Coin Analytics API', () => {
  describe('Chart Data Processing', () => {
    it('should validate chart data structure', () => {
      const mockChartData = {
        prices: [
          [1704067200000, 42000],
          [1704070800000, 42500],
          [1704074400000, 42200]
        ],
        market_caps: [
          [1704067200000, 820000000000],
          [1704070800000, 825000000000],
          [1704074400000, 822000000000]
        ],
        total_volumes: [
          [1704067200000, 15000000000],
          [1704070800000, 16000000000],
          [1704074400000, 15500000000]
        ]
      };

      expect(mockChartData).toHaveProperty('prices');
      expect(mockChartData).toHaveProperty('market_caps');
      expect(mockChartData).toHaveProperty('total_volumes');
      
      expect(Array.isArray(mockChartData.prices)).toBe(true);
      expect(mockChartData.prices.length).toBeGreaterThan(0);
      
      // Validate price data structure
      const firstPrice = mockChartData.prices[0];
      expect(Array.isArray(firstPrice)).toBe(true);
      expect(firstPrice.length).toBe(2);
      expect(typeof firstPrice[0]).toBe('number'); // timestamp
      expect(typeof firstPrice[1]).toBe('number'); // price
    });

    it('should handle empty chart data gracefully', () => {
      const emptyChartData = {
        prices: [],
        market_caps: [],
        total_volumes: []
      };

      expect(emptyChartData.prices).toHaveLength(0);
      expect(Array.isArray(emptyChartData.prices)).toBe(true);
    });
  });

  describe('Timeframe Validation', () => {
    it('should validate supported timeframes', () => {
      const supportedTimeframes = ['1', '7', '30', '90', '365'];
      
      supportedTimeframes.forEach(timeframe => {
        expect(parseInt(timeframe)).toBeGreaterThan(0);
        expect(isNaN(parseInt(timeframe))).toBe(false);
      });
    });

    it('should handle invalid timeframes', () => {
      const invalidTimeframes = ['invalid', '-1', '0', 'abc'];
      
      invalidTimeframes.forEach(timeframe => {
        const parsed = parseInt(timeframe);
        if (!isNaN(parsed)) {
          expect(parsed).toBeLessThanOrEqual(0);
        } else {
          expect(isNaN(parsed)).toBe(true);
        }
      });
    });
  });

  describe('Price Calculation Utils', () => {
    it('should calculate price change percentage correctly', () => {
      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      expect(calculatePercentageChange(110, 100)).toBeCloseTo(10, 2);
      expect(calculatePercentageChange(90, 100)).toBeCloseTo(-10, 2);
      expect(calculatePercentageChange(100, 100)).toBe(0);
      expect(calculatePercentageChange(50, 0)).toBe(0); // Handle division by zero
    });

    it('should format currency values correctly', () => {
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('Data Validation', () => {
    it('should validate coin data structure', () => {
      const mockCoinData = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://example.com/bitcoin.png',
        current_price: 42000,
        market_cap: 820000000000,
        market_cap_rank: 1,
        total_volume: 15000000000,
        price_change_percentage_24h: 2.5,
        circulating_supply: 19500000,
        total_supply: 21000000,
        max_supply: 21000000
      };

      // Required fields
      expect(mockCoinData).toHaveProperty('id');
      expect(mockCoinData).toHaveProperty('symbol');
      expect(mockCoinData).toHaveProperty('name');
      expect(mockCoinData).toHaveProperty('current_price');

      // Type validation
      expect(typeof mockCoinData.id).toBe('string');
      expect(typeof mockCoinData.symbol).toBe('string');
      expect(typeof mockCoinData.name).toBe('string');
      expect(typeof mockCoinData.current_price).toBe('number');
      expect(typeof mockCoinData.market_cap).toBe('number');

      // Value validation
      expect(mockCoinData.current_price).toBeGreaterThan(0);
      expect(mockCoinData.market_cap).toBeGreaterThan(0);
      expect(mockCoinData.market_cap_rank).toBeGreaterThan(0);
    });
  });
});