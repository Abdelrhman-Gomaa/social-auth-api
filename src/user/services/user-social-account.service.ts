import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from 'src/_common/database/database.model.repositories';
import { User } from '../models/user.model';
import { BaseHttpException } from 'src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';
import { RegisterOrLoginBySocialAccountInput } from '../input/social-account.input';
import { UserSocialAccount } from '../models/user-social-account.model';
import { DeviceEnum, SocialProvidersEnum, UserVerificationCodeUseCaseEnum } from '../user.enum';
import { UserService } from './user.service';
import { LastLoginDetailsType } from '../user.type';
import { LastLoginDetailsTransformerInput, UserByEmailBasedOnUseCaseOrErrorInput } from '../user.interface';
import { VerifyUserByEmailInput } from '../input/verify-user-by-email.input';

@Injectable()
export class UserSocialAccountService {
    constructor(
        @Inject(Repositories.UsersRepository)
        private readonly userRepo: typeof User,
        @Inject(Repositories.UserSocialAccountsRepository)
        private readonly socialAccountRepo: typeof UserSocialAccount,
        private readonly userService: UserService,
    ) { }

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

        const socialState = this.getSocialState(userBySocialAccount, userByEmail);
        switch (socialState) {
            // If email is already exists and provider doesn't 
            case 'NO_SOCIAL__HAS_EMAIL':
                return await this.isEmailExistingAndProviderNotExist(input);

            // If provider id already existed in database
            case 'SOCIAL__NO_EMAIL':
            case 'SOCIAL__HAS_EMAIL':
            case 'SOCIAL__HAS_NOT_EMAIL':
                return await this.loginBySocialAccount(userBySocialAccount, input);

            // Only straight case to register with social account directly
            case 'NO_SOCIAL__NO_EMAIL': {
                if (input.provider === SocialProvidersEnum.APPLE && input.device !== DeviceEnum.IOS)
                    throw new BaseHttpException(ErrorCodeEnum.INVALID_PLATFORM);
                return await this.registerBySocialAccount(input);
            }
            default:
                throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
        }
    }

    private getSocialState(userBySocialAccount?: User, userByEmail?: User): string {
        const states = {
            SOCIAL__HAS_EMAIL: Number( // if user with same provider and email existed
                !!userBySocialAccount && !!userByEmail && userByEmail.id === userBySocialAccount.id
            ),
            SOCIAL__HAS_NOT_EMAIL: Number( // if found users one user with same provider entered and other with same email entered
                !!userBySocialAccount && !!userByEmail && userByEmail.id !== userBySocialAccount.id
            ),
            SOCIAL__NO_EMAIL: Number(!!userBySocialAccount && !userByEmail), // if found user with same provider and different email
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