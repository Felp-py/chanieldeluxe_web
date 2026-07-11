package webintegrado.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import webintegrado.dto.request.VentaRequest;
import webintegrado.dto.response.VentaResponse;
import webintegrado.service.VentaService;
import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;

    @PostMapping
    public ResponseEntity<VentaResponse> crear(@Valid @RequestBody VentaRequest request) {
        return ResponseEntity.ok(ventaService.crear(request));
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<VentaResponse>> listarPorUsuario(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(ventaService.listarPorUsuario(idUsuario));
    }

    @GetMapping
    public ResponseEntity<List<VentaResponse>> listarTodas() {
        return ResponseEntity.ok(ventaService.listarTodas());
    }

    @PutMapping("/{idVenta}/estado")
    public ResponseEntity<VentaResponse> actualizarEstado(
            @PathVariable Integer idVenta,
            @RequestParam String estado) {
        return ResponseEntity.ok(ventaService.actualizarEstado(idVenta, estado));
    }

    /** El cliente cancela su propio pedido (solo si aún no fue enviado). */
    @PutMapping("/{idVenta}/cancelar")
    public ResponseEntity<VentaResponse> cancelar(
            @PathVariable Integer idVenta,
            @RequestParam Integer idUsuario) {
        return ResponseEntity.ok(ventaService.cancelarPorCliente(idVenta, idUsuario));
    }
}