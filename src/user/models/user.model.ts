import { Default, Column, DataType, Model, PrimaryKey, Table, Unique, CreatedAt, UpdatedAt, AllowNull, HasMany } from "sequelize-typescript";
import { ID, Field, ObjectType } from '@nestjs/graphql';
import { GenderEnum, LangEnum } from '../user.enum';
import { LastLoginDetailsType, LocationType } from '../user.type';
import { UserVerificationCode } from './user-verification-code.model';

@Table
@ObjectType()
export class User extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUID })
    @Field(() => ID)
    id: string;

    @AllowNull(true)
    @Column
    @Field({ nullable: true })
    firstName?: string;

    @AllowNull(true)
    @Column
    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: true })
    fullName?: string;

    @Unique
    @AllowNull(true)
    @Column
    @Field({ nullable: true })
    slug?: string;

    @Unique
    @AllowNull(true)
    @Column
    @Field({ nullable: true })
    userName?: string;

    @Unique
    @AllowNull(true)
    @Column({
        set(val: string) {
            val && typeof val === 'string'
                ? (this as any).setDataValue('verifiedEmail', val.toLowerCase())
                : (this as any).setDataValue('verifiedEmail', val);
        }
    })
    @Field({ nullable: true })
    verifiedEmail?: string;

    @AllowNull(true)
    @Column({
        set(val: string) {
            val && typeof val === 'string'
                ? (this as any).setDataValue('unVerifiedEmail', val.toLowerCase())
                : (this as any).setDataValue('unVerifiedEmail', val);
        }
    })
    @Field({ nullable: true })
    unVerifiedEmail?: string;

    @Default(false)
    @AllowNull(false)
    @Column
    @Field()
    isCompletedRegister: boolean;

    @Default(true)
    @AllowNull(false)
    @Column
    @Field()
    isFirstRegistration: boolean;

    @AllowNull(true)
    @Column
    @Field({ nullable: true })
    phone?: string;

    @AllowNull(true)
    @Column
    password?: string;

    @Default(GenderEnum.MALE)
    @AllowNull(false)
    @Column({ type: DataType.ENUM( ...Object.values(GenderEnum)) })
    @Field(() => GenderEnum)
    gender: GenderEnum;

    @AllowNull(true)
    @Column({ type: DataType.GEOMETRY('Point') })
    location?: LocationType;

    @AllowNull(true)
    @Column({ type: DataType.TEXT })
    @Field({ nullable: true })
    profilePicture?: string;

    @Default(false)
    @AllowNull(false)
    @Column
    @Field()
    isBlocked: boolean;

    @Default(LangEnum.EN)
    @AllowNull(false)
    @Column({ type: DataType.ENUM( ...Object.values(LangEnum)) })
    @Field(() => LangEnum)
    favLang: LangEnum;

    @Field({ nullable: true })
    token?: string;

    @AllowNull(true)
    @Column({ type: DataType.JSONB })
    @Field(() => LastLoginDetailsType, { nullable: true })
    lastLoginDetails: LastLoginDetailsType;

    @HasMany(() => UserVerificationCode)
    userVerificationCodes?: UserVerificationCode[];

    @CreatedAt
    @Column({ type: DataType.DATE })
    createdAt: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE })
    updatedAt: Date;
}
