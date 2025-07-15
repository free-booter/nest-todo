import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Record {
  [key: string]: any;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  private formatDate(date: string): string {
    if (!date) return date;
    try {
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (err) {
      this.logger.warn(`Failed to format date: ${date}`, err);
      return date;
    }
  }

  private transformValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.transformValue(item));
    }

    if (value && typeof value === 'object') {
      const transformed: Record = { ...(value as Record) };
      for (const key of Object.keys(transformed)) {
        if (key.includes('_at') || key.includes('date')) {
          this.logger.debug(`Transforming date field: ${key} = ${transformed[key]}`);
          transformed[key] = this.formatDate(transformed[key] as string);
        } else {
          transformed[key] = this.transformValue(transformed[key]);
        }
      }
      return transformed;
    }

    return value;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data) {
          const result: Record = {
            ...(data as Record),
            data: this.transformValue((data as Record).data),
          };
          return result;
        }
        const result = this.transformValue(data);
        return result;
      }),
    );
  }
}
