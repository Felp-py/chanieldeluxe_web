import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService, CarritoItem } from '../../services/carrito.service';
import { CatalogoService, Producto } from '../../services/catalogo.service';
import { VentaService, Venta } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-carrito',
  imports: [FormsModule, RouterLink, DecimalPipe, DatePipe, TitleCasePipe],
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
  // Guarda el pedido recién creado (con detalles, total, etc.) para mostrar la confirmación.
  pedidoConfirmado = signal<Venta | null>(null);
  error = signal('');
  actualizandoId = signal<number | null>(null);

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

  // Stock disponible de la variante (talla) de un item, para limitar el selector de cantidad.
  stockDisponible(item: CarritoItem): number | null {
    const prod = this.productos().find(p => p.idProducto === item.idProducto);
    const variante = prod?.variantes?.find(v => v.talla === item.talla);
    return variante ? variante.cantidadDisponible : null;
  }

  cambiarCantidad(item: CarritoItem, delta: number) {
    const max = this.stockDisponible(item);
    const nueva = item.cantidad + delta;
    if (nueva < 1) return;
    if (max !== null && nueva > max) { this.error.set(`Solo hay ${max} unidades disponibles en talla ${item.talla}.`); return; }

    this.error.set('');
    this.actualizandoId.set(item.idCarrito);
    this.carritoSvc.actualizarCantidad(item.idCarrito, nueva).subscribe({
      next: actualizado => {
        this.items.update(list => list.map(i => i.idCarrito === item.idCarrito ? actualizado : i));
        this.actualizandoId.set(null);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'No se pudo actualizar la cantidad.');
        this.actualizandoId.set(null);
      }
    });
  }

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
      next: (venta) => {
        this.carritoSvc.vaciar(user.idUsuario).subscribe();
        this.items.set([]);
        this.procesando.set(false);
        this.pedidoConfirmado.set(venta);
      },
      error: (e) => { this.procesando.set(false); this.error.set(e?.error?.message || 'Error al procesar el pedido.'); }
    });
  }
}
