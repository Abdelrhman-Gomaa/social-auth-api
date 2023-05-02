import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class ChangePasswordInput {

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    @MinLength(6)
    @Field()
    oldPassword: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    @MinLength(6)
    @Matches(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: 'Password too week' }
    )
    @Field()
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    @MinLength(6)
    @Matches(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: 'Password too week' }
    )
    @Field()
    confirmPassword: string;

}
