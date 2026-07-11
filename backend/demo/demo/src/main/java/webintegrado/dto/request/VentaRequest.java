package webintegrado.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class VentaRequest {
    @NotNull
    private Integer idUsuario;
    @NotBlank
    private String metodoPago;
    @NotBlank
    private String direccionEnvio;
    @NotBlank
    private String ciudadEnvio;
    private String observaciones;
    @NotEmpty
    private List<DetalleRequest> detalles;

    @Data
    public static class DetalleRequest {
        @NotNull
        private Integer idVariante;
        @Min(1)
        private Integer cantidad;
    }
}
