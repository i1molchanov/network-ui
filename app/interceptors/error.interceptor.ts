import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Произошла ошибка';

        if (error.error instanceof ErrorEvent) {
          // Клиентская ошибка
          errorMessage = `Ошибка: ${error.error.message}`;
        } else if (error.status >= 400 && error.status < 500) {
          // Серверная ошибка (4xx)
          errorMessage = error.error?.message || `Ошибка: ${error.message}`;
        } else if (error.status >= 500) {
          // Ошибка сервера (5xx)
          errorMessage = 'Произошла ошибка на сервере. Попробуйте позже.';
        }

        // Отображаем уведомление с ошибкой
        this.messageService.add({severity: 'error', summary: 'Ошибка', detail: errorMessage});

        // Пробрасываем ошибку дальше
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
