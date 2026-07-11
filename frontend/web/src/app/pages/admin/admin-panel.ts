import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService, Producto } from '../../services/catalogo.service';
import { VentaService, Venta } from '../../services/venta.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';

interface VarianteForm {
  talla: string;
  cantidadDisponible: number;
}

@Component({
  selector: 'app-admin-panel',
  imports: [FormsModule, DecimalPipe, DatePipe, TitleCasePipe],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel implements OnInit {
  private catalogoSvc = inject(CatalogoService);
  private ventaSvc = inject(VentaService);
  auth = inject(AuthService);

  tab = signal<'productos'|'ventas'>('productos');
  productos = signal<Producto[]>([]);
  ventas = signal<Venta[]>([]);
  loading = signal(true);
  toast = signal('');
  toastType = signal('success');
  showForm = signal(false);
  editando = signal<Producto | null>(null);

  form: any = {
    nombre: '', descripcion: '', categoria: 'blusas',
    color: '', material: '', precioUnitario: '', precioOferta: '',
    imagenUrl: ''
  };

  // Filas de tallas/stock del formulario (una fila = una talla con su cantidad).
  variantesForm: VarianteForm[] = [];

  categorias = ['vestidos','blusas','pantalones','faldas','chaquetas','abrigos','ropa_interior','pijamas','ropa_deportiva','accesorios','calzado','otros'];
  tallas = ['XS','S','M','L','XL','XXL','UNICO'];
  estadosVenta = ['pendiente','procesado','enviado','entregado','cancelado'];

  ngOnInit() { this.cargarProductos(); this.cargarVentas(); }

  cargarProductos() {
    this.catalogoSvc.listarTodos().subscribe({
      next: p => { this.productos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  cargarVentas() {
    this.ventaSvc.listarTodas().subscribe({ next: v => this.ventas.set(v), error: () => {} });
  }

  tallasResumen(p: Producto): string {
    if (!p.variantes || p.variantes.length === 0) return '—';
    return p.variantes.map(v => `${v.talla}: ${v.cantidadDisponible}`).join(' · ');
  }

  // ---- Manejo de filas de talla/stock en el formulario ----
  agregarFilaTalla() {
    const tallaLibre = this.tallas.find(t => !this.variantesForm.some(v => v.talla === t)) || this.tallas[0];
    this.variantesForm.push({ talla: tallaLibre, cantidadDisponible: 0 });
  }

  quitarFilaTalla(i: number) {
    this.variantesForm.splice(i, 1);
  }

  abrirForm(p?: Producto) {
    if (p) {
      this.editando.set(p);
      this.form = {
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria: p.categoria,
        color: p.color,
        material: p.material,
        precioUnitario: p.precioUnitario,
        precioOferta: p.precioOferta || '',
        imagenUrl: p.imagenUrl || ''
      };
      this.variantesForm = (p.variantes || []).map(v => ({ talla: v.talla, cantidadDisponible: v.cantidadDisponible }));
      if (this.variantesForm.length === 0) this.agregarFilaTalla();
    } else {
      this.editando.set(null);
      this.form = {
        nombre: '', descripcion: '', categoria: 'blusas',
        color: '', material: '', precioUnitario: '', precioOferta: '',
        imagenUrl: ''
      };
      this.variantesForm = [{ talla: 'M', cantidadDisponible: 0 }];
    }
    this.showForm.set(true);
  }

  guardar() {
    const user = this.auth.currentUser();
    if (!user) return;

    if (this.variantesForm.length === 0) {
      this.showToast('Agrega al menos una talla con su stock', 'error');
      return;
    }
    const tallasRepetidas = new Set(this.variantesForm.map(v => v.talla)).size !== this.variantesForm.length;
    if (tallasRepetidas) {
      this.showToast('No repitas la misma talla dos veces', 'error');
      return;
    }

    const data = {
      ...this.form,
      precioUnitario: +this.form.precioUnitario,
      precioOferta: this.form.precioOferta ? +this.form.precioOferta : null,
      variantes: this.variantesForm.map(v => ({ talla: v.talla, cantidadDisponible: +v.cantidadDisponible }))
    };
    const e = this.editando();
    const obs = e ? this.catalogoSvc.actualizar(e.idProducto, data) : this.catalogoSvc.crear(data, user.idUsuario);
    obs.subscribe({
      next: () => { this.showToast(e ? 'Producto actualizado' : 'Producto creado'); this.showForm.set(false); this.cargarProductos(); },
      error: () => this.showToast('Error al guardar', 'error')
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.catalogoSvc.eliminar(id).subscribe({
      next: () => { this.showToast('Producto eliminado'); this.cargarProductos(); },
      error: () => this.showToast('Error al eliminar', 'error')
    });
  }

  cambiarEstado(v: Venta, estado: string) {
    this.ventaSvc.actualizarEstado(v.idVenta, estado).subscribe({
      next: updated => { this.ventas.update(list => list.map(x => x.idVenta === updated.idVenta ? updated : x)); this.showToast('Estado actualizado'); },
      error: () => this.showToast('Error al actualizar estado', 'error')
    });
  }

  showToast(msg: string, type = 'success') {
    this.toast.set(msg); this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }

  estadoBadge(e: string) {
    const m: any = { pendiente:'badge-warn', procesado:'badge-success', enviado:'badge-success', entregado:'badge-success', cancelado:'badge-danger' };
    return m[e] || 'badge-warn';
  }
}
