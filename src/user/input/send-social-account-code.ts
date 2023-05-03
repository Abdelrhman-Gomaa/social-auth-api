import { Field, InputType } from '@nestjs/graphql';
import { LangEnum, UserVerificationCodeUseCaseEnum } from '../user.enum';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';
import { IsEmail, IsUUID } from 'class-validator';

@InputType()
export class SendSocialAccountVerificationCodeInput {
    @IsUUID('4')
    @Field()
    userId?: string;

    @IsEmail({}, { message: ErrorCodeEnum[ErrorCodeEnum.INVALID_EMAIL] })
    @Field()
    email: string;
}
