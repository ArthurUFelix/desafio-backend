import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Product } from '../../products/entities/product.entity';

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field(() => ID)
  productId: number;

  @Field(() => Product)
  product: Product;
}
