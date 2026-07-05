import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataloaderService {
  constructor(private prisma: PrismaService) {}

  createLoaders() {
    return {
      ordersByUserId: new DataLoader<number, unknown[]>(async (userIds) => {
        const orders = await this.prisma.order.findMany({
          where: { userId: { in: userIds as number[] } },
        });
        return userIds.map((id) => orders.filter((o) => o.userId === id));
      }),

      userById: new DataLoader<number, unknown>(async (userIds) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: userIds as number[] } },
        });
        const map = new Map(users.map((u) => [u.id, u]));
        return userIds.map((id) => map.get(id) ?? null);
      }),

      itemsByOrderId: new DataLoader<number, unknown[]>(async (orderIds) => {
        const items = await this.prisma.orderItem.findMany({
          where: { orderId: { in: orderIds as number[] } },
        });
        return orderIds.map((id) => items.filter((i) => i.orderId === id));
      }),

      productById: new DataLoader<number, unknown>(async (productIds) => {
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds as number[] } },
        });
        const map = new Map(products.map((p) => [p.id, p]));
        return productIds.map((id) => map.get(id) ?? null);
      }),
    };
  }
}

export type Loaders = ReturnType<DataloaderService['createLoaders']>;
