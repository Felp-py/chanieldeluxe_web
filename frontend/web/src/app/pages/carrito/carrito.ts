import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService, CarritoItem } from '../../services/carrito.service';
import { CatalogoService, Producto } from '../../services/catalogo.service';
import { VentaService } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-carrito',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito implements OnInit {
  private carritoSvc = inject(CarritoService);
  private ventaSvc = inject(VentaService);
  private catalogoSvc = inject(CatalogoService);
  auth = inject(AuthService);
  router = inject(Router);

  items = signal<CarritoItem[]>([]);
  productos = signal<Producto[]>([]);
  loading = signal(true);
  procesando = signal(false);
  exito = signal(false);
  error = signal('');

  form = { metodoPago: 'tarjeta_credito', direccionEnvio: '', ciudadEnvio: 'Lima' };

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.catalogoSvc.listar().subscribe({ next: p => this.productos.set(p) });
    this.carritoSvc.listar(user.idUsuario).subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  imagenProducto(item: CarritoItem): string {
    const prod = this.productos().find(p => p.idProducto === item.idProducto);
    return prod?.imagenUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80';
  }

  get total() { return this.items().reduce((acc, i) => acc + i.subtotal, 0); }
  get cantidadTotal() { return this.items().reduce((acc, i) => acc + i.cantidad, 0); }

  eliminar(id: number) {
    this.carritoSvc.eliminarItem(id).subscribe({
      next: () => this.items.update(list => list.filter(i => i.idCarrito !== id))
    });
  }

  confirmarPedido() {
    if (!this.form.direccionEnvio) { this.error.set('Ingresa tu dirección de envío.'); return; }
    const user = this.auth.currentUser()!;
    this.procesando.set(true);
    this.error.set('');
    const payload = {
      idUsuario: user.idUsuario,
      metodoPago: this.form.metodoPago,
      direccionEnvio: this.form.direccionEnvio,
      ciudadEnvio: this.form.ciudadEnvio,
      detalles: this.items().map(i => ({ idVariante: i.idVariante, cantidad: i.cantidad }))
    };
    this.ventaSvc.crear(payload).subscribe({
      next: () => {
        this.carritoSvc.vaciar(user.idUsuario).subscribe();
        this.items.set([]);
        this.procesando.set(false);
        this.exito.set(true);
      },
      error: (e) => { this.procesando.set(false); this.error.set(e?.error?.message || 'Error al procesar el pedido.'); }
    });
  }
}
