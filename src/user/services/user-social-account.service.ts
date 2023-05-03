import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from 'src/_common/database/database.model.repositories';
import { User } from '../models/user.model';
import { BaseHttpException } from 'src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';
import { RegisterOrLoginBySocialAccountInput } from '../input/social-account.input';
import { UserSocialAccount } from '../models/user-social-account.model';
import { DeviceEnum, LangEnum, SocialProvidersEnum, UserVerificationCodeUseCaseEnum } from '../user.enum';
import { UserService } from './user.service';
import { LastLoginDetailsType } from '../user.type';
import { LastLoginDetailsTransformerInput, UserByEmailBasedOnUseCaseOrErrorInput } from '../user.interface';
import { VerifyUserByEmailInput } from '../input/verify-user-by-email.input';
import { UserVerificationCodeService } from './user-verification-code.service';
import { SendSocialAccountVerificationCodeInput } from '../input/send-social-account-code';

@Injectable()
export class UserSocialAccountService {
    constructor(
        @Inject(Repositories.UsersRepository)
        private readonly userRepo: typeof User,
        @Inject(Repositories.UserSocialAccountsRepository)
        private readonly socialAccountRepo: typeof UserSocialAccount,
        private readonly userService: UserService,
        private readonly userVerificationCodeService: UserVerificationCodeService,
    ) { }

    public async sendVerificationSocialAccount(input: SendSocialAccountVerificationCodeInput) {
        return await this.userVerificationCodeService.sendEmailVerificationCode(
            input.userId,
            {
                favLang: LangEnum.EN,
                email: input.email,
                useCase: UserVerificationCodeUseCaseEnum.SOCIAL_REGISTER
            },
            'Social Account Verification'
        );
    }

    public async socialLoginOrRegister(input: RegisterOrLoginBySocialAccountInput): Promise<User> {
        // check if user provider already exist and login directly ....
        const socialAccount = await this.socialAccountRepo.findOne({
            where: {
                providerId: input.providerId,
                provider: input.provider
            }
        }),
            userBySocialAccount = // user with provider already Exited
                socialAccount && (await this.userRepo.findOne({ where: { id: socialAccount.userId } })),
            userByEmail = // user with same email input exists
                input.email && (await this.userRepo.findOne({ where: { verifiedEmail: input.email.toLowerCase() } }));

        if (userBySocialAccount && userBySocialAccount.isBlocked)
            throw new BaseHttpException(ErrorCodeEnum.BLOCKED_USER);

        if (userBySocialAccount) {
            return await this.loginBySocialAccount(userBySocialAccount, input);
        }

        const socialState = this.getSocialState(userBySocialAccount, userByEmail);
        switch (socialState) {
            // If email is already exists and provider doesn't 
            case 'NO_SOCIAL__HAS_EMAIL':
                return await this.isEmailExistingAndProviderNotExist(input);

            // Only straight case to register with social account directly or sign as a unverified user if mail manually entered
            case 'NO_SOCIAL__NO_EMAIL': {
                return await this.isEmailAndProviderNotExist(input);
            }
            default:
                throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
        }
    }

    public async replaceProvider(input: RegisterOrLoginBySocialAccountInput) {
        const existingUser = await this.userRepo.findOne({ where: { verifiedEmail: input.email } });
        await this.socialAccountRepo.update({ providerId: input.providerId }, { where: { provider: input.provider, userId: existingUser.id } });
        return this.userService.appendAuthTokenToUser(existingUser);
    }

    private getSocialState(userBySocialAccount?: User, userByEmail?: User): string {
        const states = {
            NO_SOCIAL__NO_EMAIL: Number(!userBySocialAccount && !userByEmail), // not found user with  provider or email
            NO_SOCIAL__HAS_EMAIL: Number(!userBySocialAccount && !!userByEmail) // found user with email only
        };
        let state: string;
        for (const s in states) {
            if (states[s]) state = s;
        }
        return state;
    }

    private async registerBySocialAccount(input: RegisterOrLoginBySocialAccountInput): Promise<User> {
        const user = await this.createUserAndSocialAccount(input);
        return this.userService.appendAuthTokenToUser(user);
    }

    private async isEmailExistingAndProviderNotExist(input: RegisterOrLoginBySocialAccountInput) {
        const existingUser = await this.userRepo.findOne({ where: { verifiedEmail: input.email } });
        if (input.emailManualInput) {
            // verified Email with otp.
            await this.verifySocialRegisterWithExistingEmail({ email: input.email, verificationCode: input.verificationCode });
            const userHasOldProvider = await this.socialAccountRepo.findAll({ where: { userId: existingUser.id } });
            if (userHasOldProvider) {
                // check provider type
                const userHasOldProviderWithSameType = await this.socialAccountRepo.findOne({ where: { userId: existingUser.id, provider: input.provider } });
                if (userHasOldProviderWithSameType) {
                    // ask to replace old provider with new One
                    console.log('ask to replace old provider with new One');
                    throw new BaseHttpException(ErrorCodeEnum.ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER_ID_ASK_TO_REPLACE);
                } else {
                    // ask user to merge with old account
                    await this.socialAccountRepo.create(
                        { providerId: input.providerId, provider: input.provider, userId: existingUser.id }
                    );
                    return await this.userService.appendAuthTokenToUser(existingUser);
                }
            } else if (!userHasOldProvider.length) {
                // ask to merge with provider
                await this.socialAccountRepo.create({ providerId: input.providerId, provider: input.provider, userId: existingUser.id });
                return await this.userService.appendAuthTokenToUser(existingUser);
            }
        } else {
            const userHasOldProvider = await this.socialAccountRepo.findAll({ where: { userId: existingUser.id } });
            if (userHasOldProvider) {
                const userHasOldProviderWithSameType = await this.socialAccountRepo.findOne({ where: { userId: existingUser.id, provider: input.provider } });
                // check provider type
                if (userHasOldProviderWithSameType) {
                    // ask to replace old provider with new One
                    throw new BaseHttpException(ErrorCodeEnum.ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER_ID_ASK_TO_REPLACE);
                } else {
                    // ask user to merge with old account
                    throw new BaseHttpException(ErrorCodeEnum.ACCOUNT_EXISTS_ASK_TO_MERGE);
                }
            } else if (!userHasOldProvider.length) {
                // create provider to existing user account
                await this.socialAccountRepo.create({ providerId: input.providerId, provider: input.provider, userId: existingUser.id });
                return await this.userService.appendAuthTokenToUser(existingUser);
            }
        }
        return existingUser;
    }

    private async isEmailAndProviderNotExist(input: RegisterOrLoginBySocialAccountInput) {
        if (!input.emailManualInput) {
            if (input.provider === SocialProvidersEnum.APPLE && input.device !== DeviceEnum.IOS)
                throw new BaseHttpException(ErrorCodeEnum.INVALID_PLATFORM);
            return await this.registerBySocialAccount(input);
        } else {
            const user = await this.createUnVerifiedUser(input);
            await this.sendVerificationSocialAccount({ userId: user.id, email: input.email });
            return user;
        }
    }

    private async createUserAndSocialAccount(
        input: RegisterOrLoginBySocialAccountInput
    ): Promise<User> {
        if (input.email) await this.userService.deleteDuplicatedUsersAtUnVerifiedEmail(input.email);
        const user = await this.userRepo.create({
            ...input,
            ...(input.email && { verifiedEmail: input.email }),
            lastLoginDetails: this.lastLoginDetailsTransformer({
                device: input.device
            })
        });
        await this.socialAccountRepo.create(
            { providerId: input.providerId, provider: input.provider, userId: user.id }
        );
        return user;
    }

    private async createUnVerifiedUser(
        input: RegisterOrLoginBySocialAccountInput
    ): Promise<User> {
        if (input.email) await this.userService.deleteDuplicatedUsersAtUnVerifiedEmail(input.email);
        return await this.userRepo.create({
            ...input,
            ...(input.email && { unVerifiedEmail: input.email }),
            lastLoginDetails: this.lastLoginDetailsTransformer({
                device: input.device
            })
        });
    }

    private async loginBySocialAccount(
        user: User,
        input: RegisterOrLoginBySocialAccountInput,
    ): Promise<User> {
        await this.userRepo.update(
            {
                lastLoginDetails: this.lastLoginDetailsTransformer({
                    device: input.device
                })
            },
            { where: { id: user.id, } }
        );
        return this.userService.appendAuthTokenToUser(user);
    }

    private lastLoginDetailsTransformer(
        input: LastLoginDetailsTransformerInput
    ): LastLoginDetailsType {
        return {
            lastLoginAt: new Date(),
            ...(input.device && { lastLoginDevice: input.device }),
            ...(input.platformDetails && { platformDetails: input.platformDetails })
        };
    }

    private async verifySocialRegisterWithExistingEmail(input: VerifyUserByEmailInput): Promise<User> {
        const user = await this.userService.userByEmailBasedOnUseCaseOrError({
            email: input.email,
            useCase: UserVerificationCodeUseCaseEnum.SOCIAL_REGISTER
        });
        // check code validation
        if (input.verificationCode != '1234') throw new BaseHttpException(ErrorCodeEnum.INVALID_VERIFICATION_CODE);
        return this.userService.appendAuthTokenToUser(user);
    }

}