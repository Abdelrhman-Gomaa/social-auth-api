import { Repositories } from 'src/_common/database/database.model.repositories';
import { UserSocialAccount } from '../models/user-social-account.model';

export const UserSocialAccountsProvider = [
  {
    provide: Repositories.UserSocialAccountsRepository,
    useValue: UserSocialAccount,
  }
];
