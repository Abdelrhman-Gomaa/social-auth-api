import { LangEnum } from 'src/user/user.enum';
import { UserVerificationCodeUseCaseEnum } from 'src/user/user.enum';

const style = `
                  h1 {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                  }
                  p {
                    font-size: 16px;
                    margin-bottom: 10px;
                    text-align: justify;
                  }
                  .verification-code {
                    font-weight: bold;
                    font-size: 18px;
                  }
              `;

export function getEmailMsg(
  verificationCode: string | number,
  favLang: LangEnum,
  useCase: UserVerificationCodeUseCaseEnum,
  firstName?: string
) {
  switch (useCase) {
    case UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION:
      if (favLang === LangEnum.EN || favLang === LangEnum.AR)
        return `<html>
                    <head>
                      <style>${style}</style>
                    </head>
                    <body>
                      <h1>Welcome to App</h1>
                      <p>Thank you for signing up for App. To complete your registration, we need to verify your email address.</p>
                      <p>Please enter the following OTP (One Time Password) in the app to verify your email address: <span class="verification-code">${verificationCode}</span></p>
                      <p>If you did not sign up for App or did not request this OTP, please ignore this email.</p>
                      <br>
                      <p>Best regards,</p>
                      <p>App Team</p>
                    </body>
                </html>`;

    case UserVerificationCodeUseCaseEnum.PASSWORD_RESET:
      if (favLang === LangEnum.EN || favLang === LangEnum.AR)
        return `<html>
                    <head>
                    <style>${style}</style>
                    </head>
                    <body>
                      <h1>Hello${firstName ? ' ' + firstName + ',' : `,`}</h1>
                      <p>We've received a request to reset your account password,</p>
                      <p>Please enter the following OTP (One Time Password) in the app to reset your Password : <span class="verification-code">${verificationCode}</span></p>
                      <p>If you did not request a password reset, you can ignore tis email, your password will not be changed.</p>
                      <br>
                      <p>Best regards,</p>
                      <p>App Team</p>
                    </body>
                </html>`;
    case UserVerificationCodeUseCaseEnum.SOCIAL_REGISTER:
      if (favLang === LangEnum.EN || favLang === LangEnum.AR)
        return `<html>
                    <head>
                      <style>${style}</style>
                    </head>
                    <body>
                      <h1>Welcome to App</h1>
                      <p>Thank you for signing up With Social Account for App. To complete your registration, we need to verify your email address.</p>
                      <p>Please enter the following OTP (One Time Password) in the app to verify your email address: <span class="verification-code">${verificationCode}</span></p>
                      <p>If you did not sign up for App or did not request this OTP, please ignore this email.</p>
                      <br>
                      <p>Best regards,</p>
                      <p>App Team</p>
                    </body>
                </html>`;
  }
}
