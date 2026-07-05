import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';

describe('Orders concurrency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ordersService: OrdersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    ordersService = app.get(OrdersService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('não deixa o estoque ficar negativo sob concorrência', async () => {
    const user = await prisma.user.create({
      data: { name: 'Teste', email: `teste-${Date.now()}@x.com` },
    });
    const product = await prisma.product.create({
      data: { name: 'Item concorrente', price: 10, stock: 5 },
    });

    const attempts = Array.from({ length: 10 }, () =>
      ordersService
        .create({
          userId: user.id,
          items: [{ productId: product.id, quantity: 1 }],
        })
        .then(() => 'ok')
        .catch(() => 'rejected'),
    );

    const results = await Promise.all(attempts);
    const succeeded = results.filter((r) => r === 'ok').length;

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(succeeded).toBe(5);
    expect(finalProduct?.stock).toBe(0);
  });
});
