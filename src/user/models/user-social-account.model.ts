import { Model, Table, ForeignKey, Column, BelongsTo, DataType, AllowNull, Default, Unique, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from './user.model';
import { SocialProvidersEnum } from '../user.enum';

@Table
@ObjectType()
export class UserSocialAccount extends Model {
    @ForeignKey(() => User)
    @Column({ onDelete: 'CASCADE', onUpdate: 'CASCADE', type: DataType.UUID })
    userId: string;

    @BelongsTo(() => User)
    user: User;

    @AllowNull(false)
    @Default(SocialProvidersEnum.FACEBOOK)
    @Column({ type: DataType.ENUM( ...Object.values(SocialProvidersEnum))  })
    @Field(type => SocialProvidersEnum)
    provider: SocialProvidersEnum;

    @AllowNull(false)
    @Unique
    @Column
    @Field()
    providerId: string;

    @CreatedAt
    @Column
    createdAt: Date;

    @UpdatedAt
    @Column
    updatedAt: Date;
}
