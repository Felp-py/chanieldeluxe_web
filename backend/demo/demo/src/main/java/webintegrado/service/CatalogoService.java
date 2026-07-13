package webintegrado.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import webintegrado.dto.request.CatalogoRequest;
import webintegrado.dto.response.CatalogoResponse;
import webintegrado.model.Catalogo;
import webintegrado.model.ProductoTalla;
import webintegrado.model.Usuario;
import webintegrado.repository.CatalogoRepository;
import webintegrado.repository.ProductoTallaRepository;
import webintegrado.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogoService {

        private final CatalogoRepository catalogoRepository;
        private final ProductoTallaRepository productoTallaRepository;
        private final UsuarioRepository usuarioRepository;

        public CatalogoResponse crear(CatalogoRequest request, Integer idAdmin) {
                Usuario admin = usuarioRepository.findById(idAdmin)
                        .orElseThrow(() -> new RuntimeException("Admin no encontrado"));

                Catalogo producto = Catalogo.builder()
                        .nombre(request.getNombre())
                        .descripcion(request.getDescripcion())
                        .categoria(Catalogo.Categoria.valueOf(request.getCategoria()))
                        .color(request.getColor())
                        .material(request.getMaterial())
                        .precioUnitario(request.getPrecioUnitario())
                        .precioOferta(request.getPrecioOferta())
                        .imagenUrl(request.getImagenUrl())
                        .estado(Catalogo.EstadoProducto.activo)
                        .fechaCreacion(LocalDateTime.now())
                        .admin(admin)
                        .build();

                Catalogo saved = catalogoRepository.save(producto);

                guardarVariantes(saved, request.getVariantes());

                return toResponse(saved);
        }

        public List<CatalogoResponse> listarActivos() {
                return catalogoRepository.findByEstado(Catalogo.EstadoProducto.activo)
                        .stream().map(this::toResponse).toList();
        }

        public List<CatalogoResponse> listarTodos() {
                return catalogoRepository.findAll()
                        .stream().map(this::toResponse).toList();
        }

        public CatalogoResponse buscarPorId(Integer id) {
                return toResponse(catalogoRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado")));
        }

        public CatalogoResponse actualizar(Integer id, CatalogoRequest request) {
                Catalogo producto = catalogoRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

                producto.setNombre(request.getNombre());
                producto.setDescripcion(request.getDescripcion());
                producto.setCategoria(Catalogo.Categoria.valueOf(request.getCategoria()));
                producto.setColor(request.getColor());
                producto.setMaterial(request.getMaterial());
                producto.setPrecioUnitario(request.getPrecioUnitario());
                producto.setPrecioOferta(request.getPrecioOferta());
                producto.setImagenUrl(request.getImagenUrl());
                producto.setFechaActualizacion(LocalDateTime.now());
                catalogoRepository.save(producto);

                if (request.getVariantes() != null && !request.getVariantes().isEmpty()) {
                        actualizarVariantes(producto, request.getVariantes());
                }

                return toResponse(producto);
        }

        public void eliminar(Integer id) {
                Catalogo producto = catalogoRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                producto.setEstado(Catalogo.EstadoProducto.inactivo);
                catalogoRepository.save(producto);
        }

        /** Crea las variantes de talla (una fila por talla) para un producto nuevo. */
        private void guardarVariantes(Catalogo producto, List<CatalogoRequest.VarianteRequest> variantesReq) {
                for (CatalogoRequest.VarianteRequest v : variantesReq) {
                        ProductoTalla variante = ProductoTalla.builder()
                                .producto(producto)
                                .talla(Catalogo.Talla.valueOf(v.getTalla()))
                                .cantidadDisponible(v.getCantidadDisponible() != null ? v.getCantidadDisponible() : 0)
                                .cantidadMinima(3)
                                .build();
                        productoTallaRepository.save(variante);
                }
        }

        /**
         * Sincroniza las variantes existentes de un producto con las enviadas desde el formulario:
         * actualiza el stock de las tallas que ya existen, crea las nuevas y elimina las que ya no están.
         */
        private void actualizarVariantes(Catalogo producto, List<CatalogoRequest.VarianteRequest> variantesReq) {
                List<ProductoTalla> existentes = productoTallaRepository.findByProductoIdProducto(producto.getIdProducto());

                List<String> tallasEnviadas = variantesReq.stream().map(CatalogoRequest.VarianteRequest::getTalla).toList();

                // eliminar variantes que ya no vienen en el request
                for (ProductoTalla ex : existentes) {
                        if (!tallasEnviadas.contains(ex.getTalla().name())) {
                                productoTallaRepository.delete(ex);
                        }
                }

                for (CatalogoRequest.VarianteRequest v : variantesReq) {
                        ProductoTalla existente = existentes.stream()
                                .filter(ex -> ex.getTalla().name().equals(v.getTalla()))
                                .findFirst().orElse(null);
                        if (existente != null) {
                                existente.setCantidadDisponible(v.getCantidadDisponible() != null ? v.getCantidadDisponible() : 0);
                                existente.setUltimaActualizacion(LocalDateTime.now());
                                productoTallaRepository.save(existente);
                        } else {
                                ProductoTalla nueva = ProductoTalla.builder()
                                        .producto(producto)
                                        .talla(Catalogo.Talla.valueOf(v.getTalla()))
                                        .cantidadDisponible(v.getCantidadDisponible() != null ? v.getCantidadDisponible() : 0)
                                        .cantidadMinima(3)
                                        .build();
                                productoTallaRepository.save(nueva);
                        }
                }
        }

        private CatalogoResponse toResponse(Catalogo c) {
                CatalogoResponse r = new CatalogoResponse();
                r.setIdProducto(c.getIdProducto());
                r.setNombre(c.getNombre());
                r.setDescripcion(c.getDescripcion());
                r.setCategoria(c.getCategoria().name());
                r.setColor(c.getColor());
                r.setMaterial(c.getMaterial());
                r.setPrecioUnitario(c.getPrecioUnitario());
                r.setPrecioOferta(c.getPrecioOferta());
                r.setImagenUrl(c.getImagenUrl());
                r.setEstado(c.getEstado().name());
                r.setFechaCreacion(c.getFechaCreacion());

                List<ProductoTalla> variantes = productoTallaRepository.findByProductoIdProducto(c.getIdProducto());
                List<CatalogoResponse.VarianteResponse> variantesResp = new ArrayList<>();
                int total = 0;
                for (ProductoTalla v : variantes) {
                        CatalogoResponse.VarianteResponse vr = new CatalogoResponse.VarianteResponse();
                        vr.setIdVariante(v.getIdVariante());
                        vr.setTalla(v.getTalla().name());
                        vr.setCantidadDisponible(v.getCantidadDisponible());
                        vr.setCantidadMinima(v.getCantidadMinima());
                        variantesResp.add(vr);
                        total += v.getCantidadDisponible();
                }
                r.setVariantes(variantesResp);
                r.setStockTotal(total);
                return r;
        }
}
