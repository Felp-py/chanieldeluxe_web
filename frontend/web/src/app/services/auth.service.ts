import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
    idUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    rol: string;
    estado: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = environment.apiUrl;
    currentUser = signal<Usuario | null>(this.loadUser());

    constructor(private http: HttpClient) {}

    private loadUser(): Usuario | null {
        const s = localStorage.getItem('usuario');
        return s ? JSON.parse(s) : null;
    }

    registrar(data: any): Observable<Usuario> {
        return this.http.post<Usuario>(`${this.apiUrl}/usuarios/registrar`, data);
    }

    login(email: string, contrasena: string): Observable<Usuario> {
        return this.http.post<Usuario>(`${this.apiUrl}/usuarios/login`, { email, contrasena }).pipe(
        tap(user => {
            localStorage.setItem('usuario', JSON.stringify(user));
            this.currentUser.set(user);
        })
        );
    }

    logout() {
        localStorage.removeItem('usuario');
        this.currentUser.set(null);
    }

    isLoggedIn(): boolean { return !!this.currentUser(); }
    isAdmin(): boolean { return this.currentUser()?.rol === 'administrador'; }
}