import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersProvider } from './providers/users.provider';
import { UserResolver } from './user.resolver';
import { UserSocialAccountService } from './services/user-social-account.service';
import { UserSocialAccountsProvider } from './providers/user-social-accounts.provider';
import { UserVerificationCodesProvider } from './providers/user-verification-code.provider';
import { UserVerificationCodeService } from './services/user-verification-code.service';
import { DatabaseModule } from 'src/_common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    UserService,
    UserSocialAccountService,
    UserVerificationCodeService,
    UserResolver,
    ...UsersProvider,
    ...UserSocialAccountsProvider,
    ...UserVerificationCodesProvider
  ],
  exports: [
    UserService,
    UserSocialAccountService,
    UserVerificationCodeService,
    ...UsersProvider,
    ...UserSocialAccountsProvider,
    ...UserVerificationCodesProvider
  ]
})
export class UserModule { }
