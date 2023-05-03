import * as jwt from 'jsonwebtoken';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { CreateUserInput } from '../input/create.user.input';
import { LoginUserInput } from '../input/login.user.input';
import { User } from '../models/user.model';
import { Repositories } from 'src/_common/database/database.model.repositories';
import { TokenPayload } from 'src/auth/auth-token-payload.interface';
import { BaseHttpException } from 'src/_common/exceptions/base-http-exception';
import { ErrorCodeEnum } from 'src/_common/exceptions/error-code.enum';
import { ChangePasswordInput } from '../input/change.password.input';
import { UserByEmailBasedOnUseCaseOrErrorInput } from '../user.interface';
import {  UserVerificationCodeUseCaseEnum } from '../user.enum';
import { generate } from 'voucher-code-generator';
import * as slug from 'speakingurl';

@Injectable()
export class UserService {
    constructor(
        @Inject(Repositories.UsersRepository)
        private readonly userRepo: typeof User,
    ) { }

    async findAll() {
        return await this.userRepo.findAll({ include: { all: true } });
    }

    async me(userId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
        return user;
    }

    async register(input: CreateUserInput) {
        const existUser = await this.userRepo.findOne({
            where: {
                [Op.or]: [{ userName: input.userName }, { verifiedEmail: input.email }]
            }
        });
        if (existUser) throw new BaseHttpException(ErrorCodeEnum.USER_ALREADY_EXIST);
        await this.deleteDuplicatedUsersAtUnVerifiedEmail(input.email);

        const salt = await bcrypt.genSalt();
        const password = input.password;
        const hashPassword = await bcrypt.hash(password, salt);

        try {
            return await this.userRepo.create({
                firstName: input.firstName,
                lastName: input.lastName,
                fullName: `${input.firstName} ${input.lastName}`,
                userName: input.userName,
                slug: this.slugify(`${input.firstName} - ${input.lastName || ''}`),
                unVerifiedEmail: input.email,
                password: hashPassword,
                phone: input.phone,
                gender: input.gender
            });
        } catch (error) {
            console.log(error.message);
        }

    }

    async signIn(input: LoginUserInput): Promise<{ accessToken: string; }> {
        const user = await this.validationUserPassword(input);
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', user);
        if (!user) {
            throw new UnauthorizedException('Invalid Credentials');
        }
        const payload: TokenPayload = { userId: user.id };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET);
        return { accessToken };
    }

    async changePassword(currentUser: string, input: ChangePasswordInput) {
        const user = await this.userRepo.findOne({ where: { id: currentUser } });
        if (!user) throw new BaseHttpException(ErrorCodeEnum.INVALID_USER);
        await this.matchPassword(input.oldPassword, user.password);
        if (input.newPassword !== input.confirmPassword) throw new BaseHttpException(ErrorCodeEnum.NEW_PASSWORD_NOT_CONFIRMED);
        if (input.newPassword === input.oldPassword) throw new BaseHttpException(ErrorCodeEnum.OLD_PASSWORD_AND_NEW_ARE_MATCHED);
        const hashPassword = await bcrypt.hash(input.newPassword, 12);
        return await this.userRepo.update({ password: hashPassword }, { where: { id: user.id } });
    }

    appendAuthTokenToUser(user: User) {
        return Object.assign(user, { token: this.generateAuthToken(user.id) });
    }

    async deleteDuplicatedUsersAtUnVerifiedEmail(duplicatedEmail: string) {
        await this.userRepo.destroy({
            where: {
                [Op.or]: [
                    {
                        unVerifiedEmail: duplicatedEmail.toLowerCase(),
                        isCompletedRegister: false
                    },
                    {
                        verifiedEmail: duplicatedEmail.toLowerCase(),
                        isCompletedRegister: false
                    }
                ]
            }
        });
    }

    async userByEmailBasedOnUseCaseOrError(input: UserByEmailBasedOnUseCaseOrErrorInput) {
        return input.useCase === UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION
            ? await this.userByNotVerifiedEmailOrError(input.email)
            : await this.userByVerifiedEmailOrError(input.email);
    }

    async userByNotVerifiedEmailOrError(email: string) {
        const user = await this.userRepo.findOne({ where: { unVerifiedEmail: email } });
        if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
        return user;
    }

    async userByVerifiedEmailOrError(email: string) {
        const user = await this.userRepo.findOne({ where: { verifiedEmail: email } });
        if (!user) throw new BaseHttpException(ErrorCodeEnum.USER_DOES_NOT_EXIST);
        return user;
    }

    private async validationUserPassword(input: LoginUserInput) {
        const user = await this.userRepo.findOne({ where: { email: input.email } });
        if (user) {
            await this.matchPassword(input.password, user.password);
            const userValidate = {
                id: user.id,
                email: user.verifiedEmail,
                password: user.password
            };
            return userValidate;
        } else {
            return null;
        }
    }

    private async matchPassword(password: string, hash: string) {
        const isMatched = hash && (await bcrypt.compare(password, hash));
        if (!isMatched) throw new BaseHttpException(ErrorCodeEnum.INCORRECT_PASSWORD);
    }

    private generateAuthToken(id: string): string {
        return jwt.sign({ userId: id }, process.env.JWT_SECRET);
    }

    private slugify(value: string): string {
        if (value.charAt(value.length - 1) === '-') value = value.slice(0, value.length - 1);
        return `${slug(value, { titleCase: true })}-${generate({
            charset: '123456789abcdefghgklmnorstuvwxyz',
            length: 4
        })[0]
            }`.toLowerCase();
    }
}
