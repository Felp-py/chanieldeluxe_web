package webintegrado.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import webintegrado.dto.request.CarritoRequest;
import webintegrado.dto.response.CarritoResponse;
import webintegrado.service.CarritoService;
import java.util.List;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoService carritoService;

    @PostMapping
    public ResponseEntity<CarritoResponse> agregar(@Valid @RequestBody CarritoRequest request) {
        return ResponseEntity.ok(carritoService.agregar(request));
    }

    @GetMapping("/{idUsuario}")
    public ResponseEntity<List<CarritoResponse>> listar(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(carritoService.listarPorUsuario(idUsuario));
    }

    @PutMapping("/item/{idCarrito}")
    public ResponseEntity<CarritoResponse> actualizarCantidad(@PathVariable Integer idCarrito, @RequestBody java.util.Map<String, Integer> body) {
        Integer cantidad = body.get("cantidad");
        return ResponseEntity.ok(carritoService.actualizarCantidad(idCarrito, cantidad));
    }

    @DeleteMapping("/item/{idCarrito}")
    public ResponseEntity<Void> eliminarItem(@PathVariable Integer idCarrito) {
        carritoService.eliminar(idCarrito);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/vaciar/{idUsuario}")
    public ResponseEntity<Void> vaciar(@PathVariable Integer idUsuario) {
        carritoService.vaciar(idUsuario);
        return ResponseEntity.noContent().build();
    }
}