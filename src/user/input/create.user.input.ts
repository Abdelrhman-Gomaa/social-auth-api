import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsString, Matches, MaxLength, MinLength, minLength } from "class-validator";
import { GenderEnum } from '../user.enum';

@InputType()
export class CreateUserInput {

    @IsString()
    @Field()
    firstName?: string;

    @IsString()
    @Field()
    lastName?: string;

    @IsString()
    @Field()
    userName?: string;

    @IsString()
    @Field()
    email?: string;

    @IsString()
    @Field()
    phone?: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: 'Password too week' }
    ) //uppercase , lowercase , number or spezial character
    @Field()
    readonly password: string;

    @IsEnum(GenderEnum)
    @Field(() => GenderEnum)
    gender: GenderEnum;

}
