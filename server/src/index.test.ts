import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './index';

describe('Server', () => {
  beforeAll(() => {
    // Start server
  });

  afterAll(() => {
    // Stop server
  });

  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      services: {
        redis: expect.any(String),
        mongodb: expect.any(String)
      }
    });
  });
}); 