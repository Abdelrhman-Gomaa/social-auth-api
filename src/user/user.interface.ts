import { User } from './models/user.model';
import { DeviceEnum, UserVerificationCodeUseCaseEnum } from './user.enum';

export interface LastLoginDetailsTransformerInput {
  device?: DeviceEnum;
  platformDetails?: object;
}

export interface UserByEmailBasedOnUseCaseOrErrorInput {
  email: string;
  useCase: UserVerificationCodeUseCaseEnum;
}

export interface ValidVerificationCodeOrErrorInput {
  user: User;
  verificationCode: string;
  useCase: UserVerificationCodeUseCaseEnum;
}

export interface DeleteVerificationCodeAndUpdateUserModelInput {
  user: User;
  useCase: UserVerificationCodeUseCaseEnum;
}

export interface VerificationCodeAndExpirationDate {
  verificationCode: string;
  expiryDateAfterOneHour: Date;
}
