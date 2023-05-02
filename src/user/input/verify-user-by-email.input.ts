import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class VerifyUserByEmailInput {
  @IsEmail()
  @IsNotEmpty()
  @Field()
  email: string;

  @Field()
  @IsNotEmpty()
  verificationCode: string;
}
