import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { App } from 'supertest/types';

jest.setTimeout(30000);

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

interface UsersQueryResult {
  users: {
    id: string;
    name: string;
    orders: {
      id: string;
      total: number;
      items: {
        quantity: number;
        price: number;
        product: { name: string };
      }[];
    }[];
  }[];
}

describe('Performance: N+1 em resolvers com DataLoader (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let queryCount = 0;

  const USERS = 20;
  const ORDERS_PER_USER = 3;
  const ITEMS_PER_ORDER = 2;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    prisma.$on('query' as never, () => {
      queryCount++;
    });

    const products = await Promise.all(
      Array.from({ length: 5 }).map((_, i) =>
        prisma.product.create({
          data: {
            name: `e2e-dataloader Produto ${i}`,
            price: 10 + i,
            stock: 100,
          },
        }),
      ),
    );

    for (let u = 0; u < USERS; u++) {
      const user = await prisma.user.create({
        data: {
          name: `User ${u}`,
          email: `e2e-dataloader-${u}-${Date.now()}@teste.com`,
        },
      });

      for (let o = 0; o < ORDERS_PER_USER; o++) {
        await prisma.order.create({
          data: {
            userId: user.id,
            total: 0,
            items: {
              create: Array.from({ length: ITEMS_PER_ORDER }).map((_, i) => ({
                productId: products[i % products.length].id,
                quantity: 1,
                price: products[i % products.length].price,
              })),
            },
          },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { order: { user: { email: { startsWith: 'e2e-dataloader' } } } },
    });
    await prisma.order.deleteMany({
      where: { user: { email: { startsWith: 'e2e-dataloader' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-dataloader' } },
    });
    await prisma.product.deleteMany({
      where: { name: { startsWith: 'e2e-dataloader Produto ' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('deve executar queries com dataloader', async () => {
    queryCount = 0;

    const response = await request(app.getHttpServer() as App)
      .post('/graphql')
      .send({
        query: `
          query {
            users {
              id
              name
              orders {
                id
                total
                items {
                  quantity
                  price
                  product {
                    name
                  }
                }
              }
            }
          }
        `,
      })
      .expect(200);

    const body = response.body as GraphQLResponse<UsersQueryResult>;

    expect(body.errors).toBeUndefined();
    expect(queryCount).toBe(4);
  });
});
