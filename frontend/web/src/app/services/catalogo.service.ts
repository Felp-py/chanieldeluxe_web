import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Variante {
  idVariante: number;
  talla: string;
  cantidadDisponible: number;
}

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  color: string;
  material: string;
  precioUnitario: number;
  precioOferta?: number;
  imagenUrl?: string;
  estado: string;
  variantes: Variante[];
  stockTotal: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = `${environment.apiUrl}/catalogo`;
  constructor(private http: HttpClient) {}
  listar(): Observable<Producto[]> { return this.http.get<Producto[]>(this.apiUrl); }
  listarTodos(): Observable<Producto[]> { return this.http.get<Producto[]>(`${this.apiUrl}/todos`); }
  buscarPorId(id: number): Observable<Producto> { return this.http.get<Producto>(`${this.apiUrl}/${id}`); }
  crear(data: any, idAdmin: number): Observable<Producto> { return this.http.post<Producto>(`${this.apiUrl}/admin/${idAdmin}`, data); }
  actualizar(id: number, data: any): Observable<Producto> { return this.http.put<Producto>(`${this.apiUrl}/admin/${id}`, data); }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/admin/${id}`); }
}
