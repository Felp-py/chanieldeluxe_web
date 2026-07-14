import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CarritoItem {
  idCarrito: number;
  idVariante: number;
  idProducto: number;
  nombreProducto: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private apiUrl = `${environment.apiUrl}/carrito`;
  count = signal(0);
  constructor(private http: HttpClient) {}
  listar(idUsuario: number): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(`${this.apiUrl}/${idUsuario}`).pipe(
      tap(items => this.count.set(items.length))
    );
  }
  agregar(idUsuario: number, idVariante: number, cantidad: number = 1): Observable<CarritoItem> {
    return this.http.post<CarritoItem>(this.apiUrl, { idUsuario, idVariante, cantidad }).pipe(
      tap(() => this.count.update(c => c + 1))
    );
  }
  actualizarCantidad(idCarrito: number, cantidad: number): Observable<CarritoItem> {
    return this.http.put<CarritoItem>(`${this.apiUrl}/item/${idCarrito}`, { cantidad });
  }
  eliminarItem(idCarrito: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/item/${idCarrito}`).pipe(
      tap(() => this.count.update(c => Math.max(0, c - 1)))
    );
  }
  vaciar(idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vaciar/${idUsuario}`).pipe(
      tap(() => this.count.set(0))
    );
  }
}
