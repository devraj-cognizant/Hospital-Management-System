import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
// 1. Add this import at the top
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http'; 

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.inteceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // 2. Add the HTTP client here
    provideHttpClient() ,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
]
  
};