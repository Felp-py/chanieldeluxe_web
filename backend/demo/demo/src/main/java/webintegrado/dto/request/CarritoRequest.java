package webintegrado.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CarritoRequest {
    @NotNull
    private Integer idUsuario;
    @NotNull
    private Integer idVariante;
    @Min(1)
    private Integer cantidad = 1;
}
