import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Catalogo } from './pages/catalogo/catalogo';
import { ProductoDetalle } from './pages/producto-detalle/producto-detalle';
import { Carrito } from './pages/carrito/carrito';
import { MisPedidos } from './pages/mis-pedidos/mis-pedidos';
import { AdminPanel } from './pages/admin/admin-panel';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', component: Inicio },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'catalogo', component: Catalogo },
    { path: 'producto/:id', component: ProductoDetalle },
    { path: 'carrito', component: Carrito, canActivate: [authGuard] },
    { path: 'mis-pedidos', component: MisPedidos, canActivate: [authGuard] },
    { path: 'admin', component: AdminPanel, canActivate: [authGuard, adminGuard] },
    { path: '**', redirectTo: '' }
];
