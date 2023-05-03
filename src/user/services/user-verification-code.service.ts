import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  DeleteVerificationCodeAndUpdateUserModelInput,
  UserByEmailBasedOnUseCaseOrErrorInput,
  ValidVerificationCodeOrErrorInput,
  VerificationCodeAndExpirationDate
} from '../user.interface';
import { LangEnum, UserVerificationCodeUseCaseEnum } from '../user.enum';
import { User } from '../models/user.model';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { UserVerificationCode } from '../models/user-verification-code.model';
import { BaseHttpException } from '../../_common/exceptions/base-http-exception';
import { Repositories } from 'src/_common/database/database.model.repositories';
import { UserService } from './user.service';
import { getEmailMsg } from 'src/_common/utils/mail-msg';
import { SendEmailVerificationCodeInput } from '../input/send-email-verification.input';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class UserVerificationCodeService {
  constructor(
    @Inject(Repositories.UserVerificationCodesRepository)
    private readonly userVerificationCodeRepo: typeof UserVerificationCode,
    @Inject(Repositories.UsersRepository)
    private readonly userRepo: typeof User,
    private readonly userService: UserService,
    @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    @InjectQueue('mail-otp') private readonly mailQueue: Queue
  ) { }

  public async sendEmailVerificationCode(
    userId: string,
    input: SendEmailVerificationCodeInput,
    subject: string
  ) {
    const codeAndExpiry = await this.generateVerificationCodeAndRemoveOldOne(userId, input.useCase);
    const msg = this.getVerificationMsg(
      codeAndExpiry.verificationCode,
      input.favLang,
      input.useCase,
      input.firstName
    );
    this.mailQueue.add('mail-otp', {
      to: input.email,
      subject,
      html: msg
    }, {
      delay: 1000
    });
    return true
  }

  public async userByEmailBasedOnUseCaseOrError(
    input: UserByEmailBasedOnUseCaseOrErrorInput
  ): Promise<User> {
    switch (input.useCase) {
      case UserVerificationCodeUseCaseEnum.PASSWORD_RESET:
        return await this.userService.userByVerifiedEmailOrError(input.email);

      case UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION:
        return await this.userService.userByNotVerifiedEmailOrError(input.email);
    }
  }

  public validVerificationCodeOrError(input: ValidVerificationCodeOrErrorInput): void {
    const verificationCode = input.user.userVerificationCodes.find(
      obj => obj.code === input.verificationCode && obj.useCase === input.useCase
    );
    if (!verificationCode) throw new BaseHttpException(ErrorCodeEnum.VERIFICATION_CODE_NOT_EXIST);
    if (verificationCode.expiryDate < new Date())
      throw new BaseHttpException(ErrorCodeEnum.EXPIRED_VERIFICATION_CODE);
  }

  public async deleteVerificationCodeAndUpdateUserModel(
    input: DeleteVerificationCodeAndUpdateUserModelInput,
    fieldsWillUpdated: object
  ): Promise<User> {
    return await this.sequelize.transaction(async transaction => {
      await this.userVerificationCodeRepo.destroy(
        {
          where: { userId: input.user.id, useCase: input.useCase },
          transaction
        }
      );
      await this.userRepo.update(
        {
          ...fieldsWillUpdated,
        }, {
        where: { userId: input.user.id },
        transaction
      }
      );
      return await this.userRepo.findOne({ where: { userId: input.user.id } });
    });
  }

  private generateVerificationCodeAndExpiryDate(): VerificationCodeAndExpirationDate {
    return {
      verificationCode:
        process.env.NODE_ENV === 'production'
          ? Math.floor(100000 + Math.random() * 900000).toString()
          : '1234',
      expiryDateAfterOneHour: new Date(Date.now() + 3600000)
    };
  }

  private async generateVerificationCodeAndRemoveOldOne(
    userId: string,
    useCase: UserVerificationCodeUseCaseEnum
  ): Promise<VerificationCodeAndExpirationDate> {
    const codeAndExpiry = this.generateVerificationCodeAndExpiryDate();
    await this.sequelize.transaction(async transaction => {
      await this.userVerificationCodeRepo.destroy({ where: { userId, useCase }, transaction });
      await this.userVerificationCodeRepo.create(
        {
          code: codeAndExpiry.verificationCode,
          expiryDate: codeAndExpiry.expiryDateAfterOneHour,
          userId,
          useCase
        }, {
        transaction
      });
      return true;
    });
    return codeAndExpiry;
  }

  private getVerificationMsg(
    verificationCode: string | number,
    favLang: LangEnum = LangEnum.AR,
    useCase: UserVerificationCodeUseCaseEnum,
    firstName?: string
  ): string {
    return getEmailMsg(verificationCode, favLang, useCase, firstName);
  }
}
