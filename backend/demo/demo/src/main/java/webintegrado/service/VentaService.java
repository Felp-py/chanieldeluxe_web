package webintegrado.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import webintegrado.dto.request.VentaRequest;
import webintegrado.dto.response.VentaResponse;
import webintegrado.model.*;
import webintegrado.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoTallaRepository productoTallaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final CarritoRepository carritoRepository;

    // Estados en los que el cliente todavía puede arrepentirse y cancelar su pedido.
    private static final Set<Venta.EstadoVenta> CANCELABLE_POR_CLIENTE =
            Set.of(Venta.EstadoVenta.pendiente, Venta.EstadoVenta.procesado);

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Venta venta = Venta.builder()
                .usuario(usuario)
                .fechaVenta(LocalDateTime.now())
                .estado(Venta.EstadoVenta.pendiente)
                .metodoPago(Venta.MetodoPago.valueOf(request.getMetodoPago()))
                .direccionEnvio(request.getDireccionEnvio())
                .ciudadEnvio(request.getCiudadEnvio())
                .observaciones(request.getObservaciones())
                .build();

        venta = ventaRepository.save(venta);
        List<DetalleVenta> detalles = new ArrayList<>();
        java.math.BigDecimal total = java.math.BigDecimal.ZERO;

        for (VentaRequest.DetalleRequest d : request.getDetalles()) {
            ProductoTalla variante = productoTallaRepository.findById(d.getIdVariante())
                    .orElseThrow(() -> new RuntimeException("Talla no encontrada: " + d.getIdVariante()));
            Catalogo producto = variante.getProducto();

            if (variante.getCantidadDisponible() < d.getCantidad())
                throw new RuntimeException("Stock insuficiente para: " + producto.getNombre() + " (talla " + variante.getTalla() + ")");

            variante.setCantidadDisponible(variante.getCantidadDisponible() - d.getCantidad());
            productoTallaRepository.save(variante);

            // El precio de venta respeta la oferta vigente si existe.
            java.math.BigDecimal precio = producto.getPrecioOferta() != null
                    ? producto.getPrecioOferta() : producto.getPrecioUnitario();

            DetalleVenta detalle = DetalleVenta.builder()
                    .venta(venta)
                    .producto(producto)
                    .variante(variante)
                    .cantidad(d.getCantidad())
                    .precioUnitario(precio)
                    .build();
            detalles.add(detalleVentaRepository.save(detalle));

            total = total.add(precio.multiply(java.math.BigDecimal.valueOf(d.getCantidad())));
        }

        venta.setTotal(total);
        venta = ventaRepository.save(venta);

        carritoRepository.deleteByUsuarioIdUsuario(request.getIdUsuario());
        return toResponse(venta, detalles);
    }

    public List<VentaResponse> listarPorUsuario(Integer idUsuario) {
        return ventaRepository.findByUsuarioIdUsuario(idUsuario)
                .stream().map(v -> toResponse(v, v.getDetalles())).toList();
    }

    public List<VentaResponse> listarTodas() {
        return ventaRepository.findAll()
                .stream().map(v -> toResponse(v, v.getDetalles())).toList();
    }

    @Transactional
    public VentaResponse actualizarEstado(Integer idVenta, String nuevoEstado) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        Venta.EstadoVenta estado = Venta.EstadoVenta.valueOf(nuevoEstado);

        if (estado == Venta.EstadoVenta.cancelado && venta.getEstado() != Venta.EstadoVenta.cancelado) {
            reponerStock(venta);
        }

        venta.setEstado(estado);
        ventaRepository.save(venta);
        return toResponse(venta, venta.getDetalles());
    }

    @Transactional
    public VentaResponse cancelarPorCliente(Integer idVenta, Integer idUsuario) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        if (!venta.getUsuario().getIdUsuario().equals(idUsuario))
            throw new RuntimeException("No puedes cancelar un pedido que no es tuyo");

        if (!CANCELABLE_POR_CLIENTE.contains(venta.getEstado()))
            throw new RuntimeException("El pedido ya está en camino y no se puede cancelar");

        reponerStock(venta);
        venta.setEstado(Venta.EstadoVenta.cancelado);
        ventaRepository.save(venta);
        return toResponse(venta, venta.getDetalles());
    }

    private void reponerStock(Venta venta) {
        if (venta.getDetalles() == null) return;
        for (DetalleVenta d : venta.getDetalles()) {
            if (d.getVariante() == null) continue;
            ProductoTalla variante = d.getVariante();
            variante.setCantidadDisponible(variante.getCantidadDisponible() + d.getCantidad());
            productoTallaRepository.save(variante);
        }
    }

    private VentaResponse toResponse(Venta v, List<DetalleVenta> detalles) {
        VentaResponse r = new VentaResponse();
        r.setIdVenta(v.getIdVenta());
        r.setIdUsuario(v.getUsuario().getIdUsuario());
        r.setNombreUsuario(v.getUsuario().getNombre() + " " + v.getUsuario().getApellido());
        r.setFechaVenta(v.getFechaVenta());
        r.setTotal(v.getTotal());
        r.setEstado(v.getEstado().name());
        r.setMetodoPago(v.getMetodoPago().name());
        r.setDireccionEnvio(v.getDireccionEnvio());
        r.setCiudadEnvio(v.getCiudadEnvio());

        if (detalles != null) {
            r.setDetalles(detalles.stream().map(d -> {
                VentaResponse.DetalleResponse dr = new VentaResponse.DetalleResponse();
                dr.setIdProducto(d.getProducto().getIdProducto());
                dr.setNombreProducto(d.getProducto().getNombre());
                dr.setTalla(d.getVariante() != null ? d.getVariante().getTalla().name() : null);
                dr.setCantidad(d.getCantidad());
                dr.setPrecioUnitario(d.getPrecioUnitario());
                dr.setSubtotal(d.getPrecioUnitario()
                        .multiply(java.math.BigDecimal.valueOf(d.getCantidad())));
                return dr;
            }).toList());
        }
        return r;
    }
}
