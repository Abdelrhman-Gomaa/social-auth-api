import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersProvider } from './providers/users.provider';
import { UserResolver } from './user.resolver';
import { UserSocialAccountService } from './services/user-social-account.service';
import { UserSocialAccountsProvider } from './providers/user-social-accounts.provider';
import { UserVerificationCodesProvider } from './providers/user-verification-code.provider';

@Module({
  providers: [
    UserService,
    UserSocialAccountService,
    UserResolver,
    ...UsersProvider,
    ...UserSocialAccountsProvider,
    ...UserVerificationCodesProvider
  ],
  exports: [
    UserService,
    UserSocialAccountService,
    ...UsersProvider,
    ...UserSocialAccountsProvider,
    ...UserVerificationCodesProvider
  ]
})
export class UserModule { }
