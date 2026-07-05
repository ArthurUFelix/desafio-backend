import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrderItemsResolver } from './order-items.resolver';

@Module({
  providers: [OrdersService, OrdersResolver, OrderItemsResolver],
})
export class OrdersModule {}
