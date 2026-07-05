import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from './client';
import { PrismaClient } from './src/generated/prisma/client';

jest.mock('./client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
