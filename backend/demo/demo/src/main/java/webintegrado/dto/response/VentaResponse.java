package webintegrado.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VentaResponse {
    private Integer idVenta;
    private Integer idUsuario;
    private String nombreUsuario;
    private LocalDateTime fechaVenta;
    private BigDecimal total;
    private String estado;
    private String metodoPago;
    private String direccionEnvio;
    private String ciudadEnvio;
    private List<DetalleResponse> detalles;

    @Data
    public static class DetalleResponse {
        private Integer idProducto;
        private String nombreProducto;
        private String talla;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
    }
}
