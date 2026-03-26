import { HttpInterceptorFn } from '@angular/common/http';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const language = localStorage.getItem('app.language') ?? 'en';
  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};
