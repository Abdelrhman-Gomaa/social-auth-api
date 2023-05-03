import { Repositories } from 'src/_common/database/database.model.repositories';
import { UserVerificationCode } from '../models/user-verification-code.model';

export const UserVerificationCodesProvider = [
  {
    provide: Repositories.UserVerificationCodesRepository,
    useValue: UserVerificationCode,
  }
];
