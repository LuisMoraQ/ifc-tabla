import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ConsultasService } from 'src/services/consultas.service';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService {

  constructor( public _EncriptadorService: ConsultasService,
    private router: Router,) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token = this._EncriptadorService.recuperarlocalstory('token')
    // console.log('token', token)
    let clonedReq=request;
    if(token){
      clonedReq=request.clone({
        setHeaders:{
          'Authorization':'Bearer ' +JSON.parse(token)
        }
      })
    }
    return next.handle(clonedReq).pipe(
      catchError((errorResponse: HttpErrorResponse) => {
        if (errorResponse instanceof HttpErrorResponse) {
          console.log(errorResponse);

          // Si no hay conexión con el servidor
          if (errorResponse.status === 0) {
            console.log('Error: No se pudo conectar con el servidor');
            return throwError(errorResponse); // Propagar el error
          }

          // Si la respuesta es 401 (No autorizado), hacer logout y redirigir
          else if (errorResponse.status === 401) {
            console.log('Error 401: No autorizado, cerrando sesión...');
            // localStorage.clear();
            // this.router.navigate(['/login']); // Redirigir al login
            return throwError(errorResponse); // Propagar el error
          }
        }

        // Propaga el error si no es un HttpErrorResponse
        return throwError(errorResponse);
      })
    );
  }
}
