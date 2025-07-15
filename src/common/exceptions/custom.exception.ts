import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from './error-code.enum';

export class CustomException extends HttpException {
  constructor(code: ErrorCode, message?: string) {
    // 如果没有提供自定义消息，使用默认消息
    const finalMessage = message || ErrorMessages[code];
    super(
      {
        statusCode: code,
        message: finalMessage,
      },
      code,
    );
  }
}
