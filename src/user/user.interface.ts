import { DeviceEnum, UserVerificationCodeUseCaseEnum } from './user.enum';

export interface LastLoginDetailsTransformerInput {
  device?: DeviceEnum;
  platformDetails?: object;
}

export interface UserByEmailBasedOnUseCaseOrErrorInput {
  email: string;
  useCase: UserVerificationCodeUseCaseEnum;
}