import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService, Producto, Variante } from '../../services/catalogo.service';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { TitleCasePipe, NgClass, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, RouterLink, TitleCasePipe, NgClass, DecimalPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  private catalogoSvc = inject(CatalogoService);
  private carritoSvc = inject(CarritoService);
  auth = inject(AuthService);

  productos = signal<Producto[]>([]);
  loading = signal(true);
  toast = signal('');
  toastType = signal('success');

  // talla seleccionada por el usuario para cada producto (antes de agregar al carrito)
  tallaSeleccionada: Record<number, string> = {};
  // cantidad seleccionada por el usuario para cada producto (antes de agregar al carrito)
  cantidadSeleccionada: Record<number, number> = {};

  filtroCategoria = '';
  filtroTalla = '';
  busqueda = '';
  ordenarPor = 'nombre';

  categorias = ['vestidos','blusas','pantalones','faldas','chaquetas','abrigos','ropa_interior','pijamas','ropa_deportiva','accesorios','calzado','otros'];
  tallas = ['XS','S','M','L','XL','XXL','UNICO'];

  ngOnInit() {
    this.catalogoSvc.listar().subscribe({
      next: p => { this.productos.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  get productosFiltrados() {
    let list = this.productos();
    if (this.filtroCategoria) list = list.filter(p => p.categoria === this.filtroCategoria);
    if (this.filtroTalla) list = list.filter(p => (p.variantes || []).some(v => v.talla === this.filtroTalla && v.cantidadDisponible > 0));
    if (this.busqueda) list = list.filter(p => p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()));
    if (this.ordenarPor === 'precio_asc') list = [...list].sort((a,b) => (a.precioOferta??a.precioUnitario)-(b.precioOferta??b.precioUnitario));
    if (this.ordenarPor === 'precio_desc') list = [...list].sort((a,b) => (b.precioOferta??b.precioUnitario)-(a.precioOferta??a.precioUnitario));
    if (this.ordenarPor === 'nombre') list = [...list].sort((a,b) => a.nombre.localeCompare(b.nombre));
    return list;
  }

  limpiarFiltros() { this.filtroCategoria = ''; this.filtroTalla = ''; this.busqueda = ''; this.ordenarPor = 'nombre'; }

  variantesDisponibles(p: Producto): Variante[] {
    return p.variantes || [];
  }

  seleccionarTalla(p: Producto, talla: string) {
    this.tallaSeleccionada[p.idProducto] = talla;
    // reinicia la cantidad al cambiar de talla, respetando el nuevo stock disponible
    this.cantidadSeleccionada[p.idProducto] = 1;
  }

  varianteElegida(p: Producto): Variante | undefined {
    const talla = this.tallaSeleccionada[p.idProducto];
    return (p.variantes || []).find(v => v.talla === talla);
  }

  cantidad(p: Producto): number {
    return this.cantidadSeleccionada[p.idProducto] || 1;
  }

  cambiarCantidad(p: Producto, delta: number) {
    const variante = this.varianteElegida(p);
    const max = variante ? variante.cantidadDisponible : 1;
    const actual = this.cantidad(p);
    const nueva = Math.min(max, Math.max(1, actual + delta));
    this.cantidadSeleccionada[p.idProducto] = nueva;
  }

  agregarAlCarrito(p: Producto) {
    const user = this.auth.currentUser();
    if (!user) { this.showToast('Inicia sesión para agregar al carrito', 'error'); return; }

    const variante = this.varianteElegida(p);
    if (!variante) { this.showToast('Selecciona una talla', 'error'); return; }
    if (variante.cantidadDisponible < 1) { this.showToast('Sin stock disponible en esa talla', 'error'); return; }

    const cantidad = this.cantidad(p);

    this.carritoSvc.agregar(user.idUsuario, variante.idVariante, cantidad).subscribe({
      next: () => {
        this.showToast(`"${p.nombre}" (talla ${variante.talla}, x${cantidad}) agregado al carrito 🛍️`);
        this.cantidadSeleccionada[p.idProducto] = 1;
      },
      error: () => this.showToast('Error al agregar al carrito', 'error')
    });
  }

  imagenUrl(p: Producto) {
    return p.imagenUrl || `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80`;
  }

  // Un producto se considera "Nuevo" si fue creado hace 14 días o menos.
  private static readonly DIAS_NUEVO = 14;
  esNuevo(p: Producto): boolean {
    if (!p.fechaCreacion) return false;
    const creado = new Date(p.fechaCreacion).getTime();
    const dias = (Date.now() - creado) / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= Catalogo.DIAS_NUEVO;
  }

  showToast(msg: string, type = 'success') {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
