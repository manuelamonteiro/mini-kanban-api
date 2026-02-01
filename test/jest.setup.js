import { jest } from '@jest/globals';

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret';

jest.setTimeout(10000);
