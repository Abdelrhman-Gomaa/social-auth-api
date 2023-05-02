import { HttpException } from '@nestjs/common';
import { ErrorCodeEnum } from './error-code.enum';

export class BaseHttpException extends HttpException {

  constructor(errorCode: ErrorCodeEnum) {
    super(ErrorCodeEnum[errorCode], errorCode);
  }

}



