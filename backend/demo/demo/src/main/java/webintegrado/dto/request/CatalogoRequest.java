package webintegrado.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CatalogoRequest {
    @NotBlank
    private String nombre;
    private String descripcion;
    @NotBlank
    private String categoria;
    private String color;
    private String material;
    @NotNull
    private BigDecimal precioUnitario;
    private BigDecimal precioOferta;
    private String imagenUrl;

    @NotEmpty
    private List<VarianteRequest> variantes;

    @Data
    public static class VarianteRequest {
        @NotBlank
        private String talla;
        @NotNull
        @Min(0)
        private Integer cantidadDisponible;
    }
}
