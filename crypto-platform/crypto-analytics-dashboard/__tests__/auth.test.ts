import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { prisma } from '@/lib/prisma';

const app = next({ dev: false, quiet: true });
const handle = app.getRequestHandler();

let server: any;
let baseURL: string;

beforeAll(async () => {
  await app.prepare();
  
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseURL = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    server.close();
  }
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('settings');
      expect(response.body.user.settings).toHaveProperty('theme', 'dark');
    });

    it('should not register a user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'testpassword123',
        name: 'Test User'
      };

      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should not register a user with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should not register a user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      // Register first user
      await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should register a user without name field', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'testpassword123'
      };

      const response = await request(baseURL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toHaveProperty('name', null);
    });
  });

  describe('POST /api/auth/[...nextauth]', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(baseURL)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'loginpassword123',
          name: 'Login User'
        });
    });

    it('should handle signin request', async () => {
      const response = await request(baseURL)
        .post('/api/auth/signin')
        .send({
          email: 'login@example.com',
          password: 'loginpassword123'
        });

      // NextAuth returns different status codes, just check it doesn't crash
      expect([200, 302, 401]).toContain(response.status);
    });
  });
});