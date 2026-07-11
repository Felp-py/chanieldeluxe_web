package webintegrado.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CatalogoResponse {
    private Integer idProducto;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String color;
    private String material;
    private BigDecimal precioUnitario;
    private BigDecimal precioOferta;
    private String imagenUrl;
    private String estado;

    private List<VarianteResponse> variantes;
    private Integer stockTotal;

    @Data
    public static class VarianteResponse {
        private Integer idVariante;
        private String talla;
        private Integer cantidadDisponible;
    }
}
