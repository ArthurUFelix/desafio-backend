import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Order } from '../../orders/entities/order.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;

  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}
