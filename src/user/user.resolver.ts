import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './services/user.service';
import { UserSocialAccountService } from './services/user-social-account.service';
import { User } from './models/user.model';
import { RegisterOrLoginBySocialAccountInput } from './input/social-account.input';
import { LangEnum } from './user.enum';
import { CurrentUser } from 'src/auth/auth-user.decorator';
import { CreateUserInput } from './input/create.user.input';
import { LoginUserInput } from './input/login.user.input';
import { SendSocialAccountVerificationCodeInput } from './input/send-social-account-code';

@Resolver('Auth')
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userSocialAccountService: UserSocialAccountService

  ) { }

  @Query(() => User)
  async me(@CurrentUser() userId: string) {
    return await this.userService.me(userId);
  }

  @Query(() => [User])
  async findAllUser() {
    return await this.userService.findAll();
  }

  @Mutation(() => User)
  async register(@Args('input') input: CreateUserInput) {
    return await this.userService.register(input);
  }

  @Mutation(() => User)
  async emailAndPasswordLogin(@Args('input') input: LoginUserInput) {
    return await this.userService.signIn(input);
  }

  @Mutation(() => User)
  async socialLoginOrRegister(@Args('input') input: RegisterOrLoginBySocialAccountInput) {
    input.favLang = LangEnum.EN;
    return await this.userSocialAccountService.socialLoginOrRegister(input);
  }

  @Mutation(() => Boolean)
  async sendVerificationSocialAccount(@Args('input') input: SendSocialAccountVerificationCodeInput) {
    return await this.userSocialAccountService.sendVerificationSocialAccount(input);
  }

  @Mutation(() => User)
  async replaceProvider(@Args('input') input: RegisterOrLoginBySocialAccountInput) {
    input.favLang = LangEnum.EN;
    return await this.userSocialAccountService.replaceProvider(input);
  }

}
