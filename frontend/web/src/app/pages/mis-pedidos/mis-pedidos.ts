import { Component, inject, OnInit, signal } from '@angular/core';
import { VentaService, Venta } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-mis-pedidos',
  imports: [DecimalPipe, DatePipe, TitleCasePipe],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit {
  private ventaSvc = inject(VentaService);
  auth = inject(AuthService);
  pedidos = signal<Venta[]>([]);
  loading = signal(true);
  pedidoDetalle = signal<Venta | null>(null);
  cancelando = signal(false);
  toast = signal('');
  toastType = signal('success');

  // El cliente solo puede cancelar mientras el pedido no ha salido a reparto.
  private cancelablesPorCliente = ['pendiente', 'procesado'];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.loading.set(true);
    this.ventaSvc.misPedidos(user.idUsuario).subscribe({
      next: p => { this.pedidos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  estadoBadge(estado: string) {
    const map: any = { pendiente: 'badge-warn', procesado: 'badge-success', enviado: 'badge-success', entregado: 'badge-success', cancelado: 'badge-danger' };
    return map[estado] || 'badge-warn';
  }

  puedeCancelar(p: Venta): boolean {
    return this.cancelablesPorCliente.includes(p.estado);
  }

  cancelarPedido(p: Venta, event: Event) {
    event.stopPropagation();
    if (!confirm(`¿Cancelar el pedido #${p.idVenta}?`)) return;
    const user = this.auth.currentUser();
    if (!user) return;
    this.cancelando.set(true);
    this.ventaSvc.cancelar(p.idVenta, user.idUsuario).subscribe({
      next: () => { this.showToast('Pedido cancelado'); this.cancelando.set(false); this.cargar(); },
      error: (e) => { this.cancelando.set(false); this.showToast(e?.error?.message || 'No se pudo cancelar el pedido', 'error'); }
    });
  }

  showToast(msg: string, type = 'success') {
    this.toast.set(msg); this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }

  verDetalle(p: Venta) { this.pedidoDetalle.set(p); }
  cerrarDetalle() { this.pedidoDetalle.set(null); }
}
