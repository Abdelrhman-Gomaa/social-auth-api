import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';
import { UserVerificationCodeUseCaseEnum, LangEnum } from 'src/user/user.enum';

@InputType()
export class SendEmailVerificationCodeInput {
  favLang: LangEnum;

  firstName?: string;

  @IsEmail({}, { message: ErrorCodeEnum[ErrorCodeEnum.INVALID_EMAIL] })
  @Field()
  email: string;

  @Field(() => UserVerificationCodeUseCaseEnum)
  useCase: UserVerificationCodeUseCaseEnum;
}
