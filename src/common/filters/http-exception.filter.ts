import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

interface ExceptionResponse {
  message: string | string[];
  statusCode?: number;
  error?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ExceptionResponse;

    // 处理 message 字段，确保它是字符串类型
    let message = '请求失败';
    if (exceptionResponse.message) {
      message = Array.isArray(exceptionResponse.message) ? exceptionResponse.message[0] : exceptionResponse.message;
    }

    const errorResponse = {
      code: status,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
