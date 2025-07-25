import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: any) => {
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }

        return {
          code: 200,
          message: '操作成功',
          data,
        };
      }),
    );
  }
}
