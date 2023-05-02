import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MaxLength, IsBoolean } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { DeviceEnum, LangEnum, SocialProvidersEnum } from 'src/user/user.enum';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';

@InputType()
export class RegisterOrLoginBySocialAccountInput {
  favLang: LangEnum;

  @Field()
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @Field(type => SocialProvidersEnum)
  @IsNotEmpty()
  provider: SocialProvidersEnum;

  @IsOptional()
  @IsEmail({}, { message: ErrorCodeEnum[ErrorCodeEnum.INVALID_EMAIL] })
  @Field({ nullable: true })
  email?: string;

  @Field(type => DeviceEnum)
  @IsEnum(DeviceEnum)
  @IsNotEmpty()
  device: DeviceEnum;

  @Field(type => Boolean, { nullable: true })
  @IsBoolean()
  @IsNotEmpty()
  emailManualInput: boolean;

  @Field({ nullable: true })
  @IsOptional()
  verificationCode: string;
}
