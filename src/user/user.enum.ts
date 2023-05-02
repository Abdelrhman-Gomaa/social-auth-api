import { registerEnumType } from '@nestjs/graphql';

export enum GenderEnum {
    MALE = 'MALE',
    FEMALE = 'FEMALE'
}
registerEnumType(GenderEnum, { name: 'GenderEnum' });

export enum LangEnum {
    EN = 'EN',
    AR = 'AR'
}
registerEnumType(LangEnum, { name: 'LangEnum' });

export enum DeviceEnum {
    DESKTOP = 'DESKTOP',
    IOS = 'IOS',
    ANDROID = 'ANDROID'
}
registerEnumType(DeviceEnum, { name: 'DeviceEnum' });

export enum SocialProvidersEnum {
    FACEBOOK = 'FACEBOOK',
    TWITTER = 'TWITTER',
    GOOGLE = 'GOOGLE',
    APPLE = 'APPLE'
}
registerEnumType(SocialProvidersEnum, { name: 'SocialProvidersEnum' });

export enum UserVerificationCodeUseCaseEnum {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    SOCIAL_REGISTER = 'SOCIAL_REGISTER',
}
registerEnumType(UserVerificationCodeUseCaseEnum, { name: 'UserVerificationCodeUseCaseEnum' });