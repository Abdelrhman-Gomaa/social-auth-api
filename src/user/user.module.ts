import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersProvider } from './providers/users.provider';
import { UserResolver } from './user.resolver';
import { UserSocialAccountService } from './services/user-social-account.service';
import { UserSocialAccountsProvider } from './providers/user-social-accounts.provider';

@Module({
  providers: [
    UserService,
    UserSocialAccountService,
    UserResolver,
    ...UsersProvider,
    ...UserSocialAccountsProvider
  ],
  exports: [
    UserService,
    UserSocialAccountService,
    ...UsersProvider,
    ...UserSocialAccountsProvider
  ]
})
export class UserModule { }
