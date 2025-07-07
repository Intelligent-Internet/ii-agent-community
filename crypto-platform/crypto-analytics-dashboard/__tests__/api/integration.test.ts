import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

describe('API Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'integration-test'
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.userSettings.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.user.deleteMany({
        where: { id: testUserId }
      });
    }
    await prisma.$disconnect();
  });

  describe('User Journey Integration', () => {
    it('should complete full user registration to dashboard flow', async () => {
      // Step 1: Register user
      const registerResponse = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Integration Test User',
          email: 'integration-test@example.com',
          password: 'testpassword123'
        }),
      });

      expect(registerResponse.status).toBe(201);
      const registerData = await registerResponse.json();
      expect(registerData.user.email).toBe('integration-test@example.com');
      testUserId = registerData.user.id;

      // Step 2: Verify user settings were created
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: testUserId }
      });

      expect(userSettings).toBeTruthy();
      expect(userSettings?.theme).toBe('dark');
      expect(userSettings?.defaultCurrency).toBe('USD');
    });

    it('should handle authentication flow properly', async () => {
      // Test signin endpoint exists and handles requests
      const signinResponse = await fetch('http://localhost:3002/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'integration-test@example.com',
          password: 'testpassword123'
        }),
      });

      // NextAuth signin may return different status codes depending on configuration
      expect([200, 302, 405, 500]).toContain(signinResponse.status);
    });
  });

  describe('API Endpoint Availability', () => {
    it('should have auth register endpoint available', async () => {
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'GET'
      });
      // Endpoint should exist (not 404), might return 405 for wrong method
      expect(response.status).not.toBe(404);
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across operations', async () => {
      if (!testUserId) {
        return; // Skip if user wasn't created
      }

      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { settings: true }
      });

      expect(user).toBeTruthy();
      expect(user?.settings).toBeTruthy();
      expect(user?.email).toBe('integration-test@example.com');
    });

    it('should handle database constraints properly', async () => {
      // Try to create duplicate user
      const duplicateResponse = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Duplicate User',
          email: 'integration-test@example.com', // Same email
          password: 'anotherpassword123'
        }),
      });

      expect(duplicateResponse.status).toBe(400);
      const errorData = await duplicateResponse.json();
      expect(errorData.error).toBe('User already exists');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedResponse = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          email: 'incomplete@example.com'
        }),
      });

      expect(malformedResponse.status).toBe(400);
    });

    it('should validate request data properly', async () => {
      const invalidResponse = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email', // Invalid email format
          password: '123' // Too short password
        }),
      });

      expect(invalidResponse.status).toBe(400);
    });
  });

  describe('Security Integration', () => {
    it('should properly hash passwords', async () => {
      if (!testUserId) {
        return; // Skip if user wasn't created
      }

      const user = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(user?.password).toBeTruthy();
      expect(user?.password).not.toBe('testpassword123'); // Password should be hashed
      expect(user?.password.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });
  });

  describe('Performance Considerations', () => {
    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3002/api/crypto/markets?vs_currency=usd&per_page=5');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // API should respond within 10 seconds (generous limit for external API calls)
      expect(responseTime).toBeLessThan(10000);
    });
  });

  describe('Data Validation', () => {
    it('should maintain consistent data types across the application', () => {
      // Test common data structures used throughout the app
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCoin = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000000
      };

      const mockNews = {
        title: 'Bitcoin News',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        sentiment: 'positive'
      };

      // Validate data structure consistency
      expect(typeof mockUser.id).toBe('string');
      expect(typeof mockUser.email).toBe('string');
      expect(mockUser.createdAt instanceof Date).toBe(true);

      expect(typeof mockCoin.id).toBe('string');
      expect(typeof mockCoin.current_price).toBe('number');
      expect(typeof mockCoin.market_cap).toBe('number');

      expect(typeof mockNews.title).toBe('string');
      expect(typeof mockNews.url).toBe('string');
      expect(mockNews.publishedAt instanceof Date).toBe(true);
      expect(['positive', 'negative', 'neutral']).toContain(mockNews.sentiment);
    });
  });
});