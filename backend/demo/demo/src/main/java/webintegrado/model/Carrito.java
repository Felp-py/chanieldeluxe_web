package webintegrado.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "carrito")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Carrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_carrito")
    private Integer idCarrito;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_variante", nullable = false)
    private ProductoTalla variante;

    @Builder.Default
    @Column(nullable = false)
    private Integer cantidad = 1;

    @Column(name = "fecha_agregado")
    private LocalDateTime fechaAgregado;
}