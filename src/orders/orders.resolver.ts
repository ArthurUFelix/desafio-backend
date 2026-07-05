import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Float,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';
import { User } from '../users/entities/user.entity';
import type { Loaders } from '../dataloader/dataloader.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => [Order])
  orders() {
    return this.ordersService.findAll();
  }

  @Query(() => Order, { nullable: true })
  order(@Args('id', { type: () => Int }) id: number) {
    return this.ordersService.findOne(id);
  }

  @Mutation(() => Order)
  createOrder(@Args('input') input: CreateOrderInput) {
    return this.ordersService.create(input);
  }

  @ResolveField(() => Float)
  total(@Parent() order: Order) {
    return Number(order.total);
  }

  @ResolveField(() => User)
  user(@Parent() order: Order, @Context('loaders') loaders: Loaders) {
    return loaders.userById.load(order.userId);
  }

  @ResolveField(() => [OrderItem])
  items(@Parent() order: Order, @Context('loaders') loaders: Loaders) {
    return loaders.itemsByOrderId.load(order.id);
  }
}
