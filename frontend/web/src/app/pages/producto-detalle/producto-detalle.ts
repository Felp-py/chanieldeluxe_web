import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService, Producto, Variante } from '../../services/catalogo.service';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { TitleCasePipe, DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-producto-detalle',
    imports: [RouterLink, TitleCasePipe, DecimalPipe],
    templateUrl: './producto-detalle.html',
    styleUrl: './producto-detalle.css'
})
    export class ProductoDetalle implements OnInit {
    private route = inject(ActivatedRoute);
    private catalogoSvc = inject(CatalogoService);
    private carritoSvc = inject(CarritoService);
    auth = inject(AuthService);

    producto = signal<Producto | null>(null);
    loading = signal(true);
    notFound = signal(false);

    tallaSeleccionada = signal<string | null>(null);
    cantidadSeleccionada = signal(1);
    toast = signal('');
    toastType = signal('success');

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) { this.notFound.set(true); this.loading.set(false); return; }

        this.catalogoSvc.buscarPorId(id).subscribe({
        next: p => { this.producto.set(p); this.loading.set(false); },
        error: () => { this.notFound.set(true); this.loading.set(false); }
        });
    }

    seleccionarTalla(talla: string) {
        this.tallaSeleccionada.set(talla);
        // reinicia la cantidad al cambiar de talla, respetando el nuevo stock disponible
        this.cantidadSeleccionada.set(1);
    }

    get varianteElegida(): Variante | undefined {
        const p = this.producto();
        const talla = this.tallaSeleccionada();
        if (!p || !talla) return undefined;
        return (p.variantes || []).find(v => v.talla === talla);
    }

    cambiarCantidad(delta: number) {
        const variante = this.varianteElegida;
        const max = variante ? variante.cantidadDisponible : 1;
        const nueva = Math.min(max, Math.max(1, this.cantidadSeleccionada() + delta));
        this.cantidadSeleccionada.set(nueva);
    }

    agregarAlCarrito() {
        const p = this.producto();
        const user = this.auth.currentUser();
        if (!p) return;
        if (!user) { this.showToast('Inicia sesión para agregar al carrito', 'error'); return; }

        const variante = this.varianteElegida;
        if (!variante) { this.showToast('Selecciona una talla', 'error'); return; }
        if (variante.cantidadDisponible < 1) { this.showToast('Sin stock disponible en esa talla', 'error'); return; }

        const cantidad = this.cantidadSeleccionada();

        this.carritoSvc.agregar(user.idUsuario, variante.idVariante, cantidad).subscribe({
        next: () => {
            this.showToast(`"${p.nombre}" (talla ${variante.talla}, x${cantidad}) agregado al carrito 🛍️`);
            this.cantidadSeleccionada.set(1);
        },
        error: () => this.showToast('Error al agregar al carrito', 'error')
        });
    }

    imagenUrl(p: Producto) {
        return p.imagenUrl || `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80`;
    }

    showToast(msg: string, type = 'success') {
        this.toast.set(msg);
        this.toastType.set(type);
        setTimeout(() => this.toast.set(''), 3000);
    }
}
