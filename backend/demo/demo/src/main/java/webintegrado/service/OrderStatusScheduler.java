package webintegrado.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import webintegrado.model.Venta;
import webintegrado.repository.VentaRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderStatusScheduler {

    private final VentaRepository ventaRepository;
    private static final Duration T_PROCESADO = Duration.ofHours(2);
    private static final Duration T_ENVIADO = Duration.ofHours(8);
    private static final Duration T_ENTREGADO = Duration.ofHours(24);

    private static final List<Venta.EstadoVenta> PROGRESION = List.of(
            Venta.EstadoVenta.pendiente,
            Venta.EstadoVenta.procesado,
            Venta.EstadoVenta.enviado,
            Venta.EstadoVenta.entregado
    );

    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void avanzarEstadosDePedidos() {
        List<Venta> ventas = ventaRepository.findAll();
        LocalDateTime ahora = LocalDateTime.now();

        for (Venta venta : ventas) {
            if (venta.getEstado() == Venta.EstadoVenta.cancelado) continue;
            if (venta.getEstado() == Venta.EstadoVenta.entregado) continue;
            if (venta.getFechaVenta() == null) continue;

            Venta.EstadoVenta estadoCalculado = calcularEstadoPorTiempo(venta.getFechaVenta(), ahora);
            int idxActual = PROGRESION.indexOf(venta.getEstado());
            int idxCalculado = PROGRESION.indexOf(estadoCalculado);

            if (idxCalculado > idxActual) {
                venta.setEstado(estadoCalculado);
                ventaRepository.save(venta);
            }
        }
    }

    private Venta.EstadoVenta calcularEstadoPorTiempo(LocalDateTime fechaVenta, LocalDateTime ahora) {
        Duration transcurrido = Duration.between(fechaVenta, ahora);

        if (transcurrido.compareTo(T_ENTREGADO) >= 0) return Venta.EstadoVenta.entregado;
        if (transcurrido.compareTo(T_ENVIADO) >= 0) return Venta.EstadoVenta.enviado;
        if (transcurrido.compareTo(T_PROCESADO) >= 0) return Venta.EstadoVenta.procesado;
        return Venta.EstadoVenta.pendiente;
    }
}
