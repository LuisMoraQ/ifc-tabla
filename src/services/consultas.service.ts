import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class ConsultasService {
  enviUrl = environment?.apiUrl;;
  key = environment?.key;
  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  constructor(private http: HttpClient) {
 
  }

  encryptar(text: string) {
    var key = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f');
    var iv = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f');
    return CryptoJS.AES.encrypt(text, key, { iv: iv }).toString();
  }
  desencryptar(text: string) {
    var key = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f');
    var iv = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f');
    return CryptoJS.AES.decrypt(text, key, { iv: iv }).toString(
      CryptoJS.enc.Utf8
    );
  }
  recuperarlocalstory(clave: any): any {
    let claveencrytada = localStorage.getItem(this.encryptar(clave));
    if (claveencrytada != null) return this.desencryptar(claveencrytada);
  }
  tablasMetradoTit(params = {}): Promise<any> {
    let formData: FormData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    const url = this.enviUrl + '/api/metrados/tablasMetradoTit';
    return this.http
      .post<any>(url, formData)
      .pipe(
        map((res) => {
          if (!res) {
            throw new Error();
          }
          return res;
        }),
        catchError((err) => throwError(err))
      )
      .toPromise();
  }

  redondeo(num: number, dec: number): string {
    const precision = 10 ** dec;
    const n = num * precision * (1 + Number.EPSILON);
    const roundedNumber = Math.round(n) / precision;
    return roundedNumber.toFixed(dec);
}

  ListarMetradoIfc(params = {}): Promise<any>  {
    let formData: FormData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    const url = this.enviUrl + '/api/metrados/ListarMetradoIfc';
    return this.http
      .post<any>(url, formData)
      .pipe(
        map((res) => {
          if (!res) {
            throw new Error();
          }
          return res;
        }),
        catchError((err) => throwError(err))
      )
      .toPromise();
  }

  guardarMetradoIfc(params = {}): Promise<any> {
    const url = this.enviUrl + '/api/metrados/guardarMetradoIfc';
    return this.http.post<any>(url, params, { headers: this.httpHeaders }).pipe(
      map(res => {
        if (!res) {
          throw new Error
        }
        return res
      }),
      catchError(err => throwError(err))
    ).toPromise()
  }

  listarDetalleMetradoIfc(params = {}): Observable<any> {
    let formData: FormData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    const url = `${this.enviUrl}/api/metrados/listarMetradoIfcdet`;
    return this.http.post<any>(url, formData).pipe(
      map(res => {
        if (!res) {
          throw new Error('No se recibió una respuesta válida');
        }
        return res;
      }),
      catchError(err => {
        console.error('Error en la solicitud:', err);
        return throwError(() => new Error('Ocurrió un error en la solicitud'));
      })
    );
  }

  guardarDetalleMetradoIfc(params = {}): Observable<any> {
    const url = `${this.enviUrl}/api/metrados/guardarMetradoIfcdet`;
    return this.http.post<any>(url, params, { headers: this.httpHeaders }).pipe(
      map(res => {
        if (!res) {
          throw new Error('No se recibió una respuesta válida');
        }
        return res;
      }),
      catchError(err => {
        console.error('Error en la solicitud:', err);
        return throwError(() => new Error('Ocurrió un error en la solicitud'));
      })
    );
  }

  modificarDetalleMetradoIfc(params = {}): Observable<any> {
    const url = `${this.enviUrl}/api/metrados/modificarMetradoIfcdet`;
    return this.http.post<any>(url, params, { headers: this.httpHeaders }).pipe(
      map(res => {
        if (!res) {
          throw new Error('No se recibió una respuesta válida');
        }
        return res;
      }),
      catchError(err => {
        console.error('Error en la solicitud:', err);
        return throwError(() => new Error('Ocurrió un error en la solicitud'));
      })
    );
  }

  eliminarDetalleMetradoIfc(params = {}): Observable<any> {
    let formData: FormData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    const url = `${this.enviUrl}/api/metrados/eliminarMetradoIfcdet`;
    return this.http.post<any>(url, formData).pipe(
      map(res => {
        if (!res) {
          throw new Error('No se recibió una respuesta válida');
        }
        return res;
      }),
      catchError(err => {
        console.error('Error en la solicitud:', err);
        return throwError(() => new Error('Ocurrió un error en la solicitud'));
      })
    );
  }
}
