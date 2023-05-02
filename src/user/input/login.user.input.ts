import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class LoginUserInput {
    
    @IsString()
    @Field()
    readonly email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: 'Password too week'}
    ) //uppercase , lowercase , number or spezial character
    @Field()
    readonly password: string;

}
