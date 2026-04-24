import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  code: number;
  data: T;
  errors: string[];
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T | object>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T | object>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        data: data ?? {},
        errors: [],
      })),
    );
  }
}
