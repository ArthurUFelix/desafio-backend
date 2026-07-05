import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: number;

  @Field(() => Float)
  total: number;

  @Field()
  createdAt: Date;

  @Field(() => ID)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => [OrderItem])
  items: OrderItem[];
}
