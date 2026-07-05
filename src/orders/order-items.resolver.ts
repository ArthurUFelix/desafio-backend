import {
  Resolver,
  ResolveField,
  Parent,
  Float,
  Context,
} from '@nestjs/graphql';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import type { Loaders } from '../dataloader/dataloader.service';

@Resolver(() => OrderItem)
export class OrderItemsResolver {
  @ResolveField(() => Float)
  price(@Parent() item: OrderItem) {
    return Number(item.price);
  }

  @ResolveField(() => Product)
  product(@Parent() item: OrderItem, @Context('loaders') loaders: Loaders) {
    return loaders.productById.load(item.productId);
  }
}
