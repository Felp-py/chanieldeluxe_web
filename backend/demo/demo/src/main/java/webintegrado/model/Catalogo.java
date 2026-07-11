package webintegrado.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "catalogo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Catalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Categoria categoria;

    // Un producto ahora puede tener varias tallas, cada una con su propio stock.
    // Ver la entidad ProductoTalla.
    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductoTalla> variantes = new java.util.ArrayList<>();

    @Column(length = 50)
    private String color;

    @Column(length = 100)
    private String material;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "precio_oferta", precision = 10, scale = 2)
    private BigDecimal precioOferta;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoProducto estado;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne
    @JoinColumn(name = "id_admin", nullable = false)
    private Usuario admin;

    public enum Categoria {
        vestidos, blusas, pantalones, faldas, chaquetas,
        abrigos, ropa_interior, pijamas, ropa_deportiva,
        accesorios, calzado, otros
    }
    public enum Talla { XS, S, M, L, XL, XXL, UNICO }
    public enum EstadoProducto { activo, inactivo }
}
