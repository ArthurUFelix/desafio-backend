import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../singleton';
import { Prisma } from '../generated/prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(OrdersService);

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return await callback(prismaMock);
    });
  });

  it('rejeita pedido para usuário inexistente', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 999,
        items: [{ productId: 1, quantity: 1 }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejeita pedido quando estoque é insuficiente', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      createdAt: new Date(),
      email: 'test@mail.com',
      name: 'test',
    });
    prismaMock.$queryRaw.mockResolvedValue([
      { id: 1, name: 'Mouse', price: 100, stock: 1 },
    ]);

    await expect(
      service.create({ userId: 1, items: [{ productId: 1, quantity: 5 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('cria pedido e calcula total corretamente', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      createdAt: new Date(),
      email: 'test@mail.com',
      name: 'test',
    });
    prismaMock.$queryRaw.mockResolvedValue([
      { id: 1, name: 'Mouse', price: 100, stock: 10 },
    ]);
    prismaMock.order.create.mockResolvedValue({
      id: 1,
      total: new Prisma.Decimal(200),
      createdAt: new Date(),
      userId: 1,
    });

    const result = await service.create({
      userId: 1,
      items: [{ productId: 1, quantity: 2 }],
    });
    const updateSpy = jest.spyOn(prismaMock.product, 'update');

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { decrement: 2 } },
    });
    expect(Number(result.total)).toBe(200);
  });
});
