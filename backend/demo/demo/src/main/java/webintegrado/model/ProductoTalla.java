package webintegrado.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "producto_talla", uniqueConstraints = @UniqueConstraint(columnNames = {"id_producto", "talla"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoTalla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_variante")
    private Integer idVariante;

    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private Catalogo producto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Catalogo.Talla talla;

    @Builder.Default
    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible = 0;

    @Builder.Default
    @Column(name = "cantidad_minima", nullable = false)
    private Integer cantidadMinima = 3;

    @Builder.Default
    @Column(name = "ultima_actualizacion")
    private LocalDateTime ultimaActualizacion = LocalDateTime.now();
}
