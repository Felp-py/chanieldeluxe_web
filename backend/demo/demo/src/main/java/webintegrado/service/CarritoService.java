package webintegrado.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import webintegrado.dto.request.CarritoRequest;
import webintegrado.dto.response.CarritoResponse;
import webintegrado.model.Carrito;
import webintegrado.model.ProductoTalla;
import webintegrado.model.Usuario;
import webintegrado.repository.CarritoRepository;
import webintegrado.repository.ProductoTallaRepository;
import webintegrado.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoRepository carritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoTallaRepository productoTallaRepository;

    public CarritoResponse agregar(CarritoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        ProductoTalla variante = productoTallaRepository.findById(request.getIdVariante())
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        Carrito carrito = carritoRepository
                .findByUsuarioIdUsuarioAndVarianteIdVariante(
                        request.getIdUsuario(), request.getIdVariante())
                .map(c -> { c.setCantidad(c.getCantidad() + request.getCantidad()); return c; })
                .orElse(Carrito.builder()
                        .usuario(usuario)
                        .variante(variante)
                        .cantidad(request.getCantidad())
                        .fechaAgregado(LocalDateTime.now())
                        .build());

        return toResponse(carritoRepository.save(carrito));
    }

    public List<CarritoResponse> listarPorUsuario(Integer idUsuario) {
        return carritoRepository.findByUsuarioIdUsuario(idUsuario)
                .stream().map(this::toResponse).toList();
    }

    public void eliminar(Integer idCarrito) {
        carritoRepository.deleteById(idCarrito);
    }

    public void vaciar(Integer idUsuario) {
        carritoRepository.deleteByUsuarioIdUsuario(idUsuario);
    }

    private CarritoResponse toResponse(Carrito c) {
        CarritoResponse r = new CarritoResponse();
        r.setIdCarrito(c.getIdCarrito());
        r.setIdVariante(c.getVariante().getIdVariante());
        r.setIdProducto(c.getVariante().getProducto().getIdProducto());
        r.setNombreProducto(c.getVariante().getProducto().getNombre());
        r.setTalla(c.getVariante().getTalla().name());
        r.setCantidad(c.getCantidad());
        r.setPrecioUnitario(c.getVariante().getProducto().getPrecioUnitario());
        r.setSubtotal(c.getVariante().getProducto().getPrecioUnitario()
                .multiply(java.math.BigDecimal.valueOf(c.getCantidad())));
        return r;
    }
}
