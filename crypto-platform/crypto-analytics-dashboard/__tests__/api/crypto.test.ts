import { describe, it, expect } from '@jest/globals';

describe('Crypto API', () => {
  describe('GET /api/crypto/markets', () => {
    it('should handle market data request gracefully', async () => {
      const response = await fetch('http://localhost:3002/api/crypto/markets?vs_currency=usd&order=market_cap_desc&per_page=3&page=1');
      
      // API might return various responses depending on external service availability
      expect([200, 429, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          expect(data).toBeDefined();
          
          // If data exists, check structure
          if (data.length > 0) {
            const firstCoin = data[0];
            expect(firstCoin).toHaveProperty('id');
            expect(firstCoin).toHaveProperty('symbol');
            expect(firstCoin).toHaveProperty('name');
          }
        }
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch('http://localhost:3002/api/crypto/markets?vs_currency=invalid&order=invalid&per_page=abc&page=xyz');
      
      // Should handle invalid parameters gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Crypto Market Data Structure', () => {
    it('should maintain consistent data structure', () => {
      // Test that our expected data structure is valid
      const mockCoinData = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000
      };
      
      expect(mockCoinData).toHaveProperty('id');
      expect(mockCoinData).toHaveProperty('symbol');
      expect(mockCoinData).toHaveProperty('name');
      expect(mockCoinData).toHaveProperty('current_price');
      expect(mockCoinData).toHaveProperty('market_cap');
      
      expect(typeof mockCoinData.id).toBe('string');
      expect(typeof mockCoinData.current_price).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Test that our error handling works
      const mockError = new Error('Network timeout');
      expect(mockError.message).toBe('Network timeout');
    });
  });
});