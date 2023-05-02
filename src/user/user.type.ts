import { ObjectType, Float, Field } from '@nestjs/graphql';
import { Timestamp } from 'src/_common/graphql/timestamp.scalar';
import { DeviceEnum } from './user.enum';

@ObjectType()
export class LocationType {
  @Field()
  type: string;

  @Field(() => [Float])
  coordinates: number[];
}

@ObjectType()
export class LastLoginDetailsType {
  @Field(() => Number, { nullable: true })
  lastLoginAt?: Timestamp | number | Date;

  @Field(() => String, { nullable: true })
  readableLastLoginAt?: Timestamp | number | Date;

  @Field(() => DeviceEnum, { nullable: true })
  lastLoginDevice?: DeviceEnum;

  // @Field(() => JSON, { nullable: true })
  // platformDetails?: object;
}