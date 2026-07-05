import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { Prisma } from '../generated/prisma/client';

interface ProductRow {
  id: number;
  name: string;
  price: Prisma.Decimal;
  stock: number;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany();
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({ where: { id } });
  }

  async create(data: CreateOrderInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        let total = 0;
        const itemsData: {
          productId: number;
          quantity: number;
          price: number;
        }[] = [];

        const products = await tx.$queryRaw<ProductRow[]>`
          SELECT id, name, price, stock
          FROM products
          WHERE id in (${data.items.map((i) => Number(i.productId)).join(',')})
          FOR UPDATE
        `;
        const productById: Record<number, ProductRow> = products.reduce(
          (acc, crr) => {
            acc[crr.id] = crr;
            return acc;
          },
          {},
        );

        for (const item of data.items) {
          const product = productById[item.productId];
          if (!product) {
            throw new NotFoundException(
              `Produto ${item.productId} não encontrado`,
            );
          }
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Estoque insuficiente para o produto "${product.name}"`,
            );
          }

          const unitPrice = Number(product.price);
          total += unitPrice * item.quantity;

          itemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: unitPrice,
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        return await tx.order.create({
          data: {
            userId: data.userId,
            total,
            items: { create: itemsData },
          },
          include: { items: true, user: true },
        });
      },
      { timeout: 10000 },
    );
  }
}
