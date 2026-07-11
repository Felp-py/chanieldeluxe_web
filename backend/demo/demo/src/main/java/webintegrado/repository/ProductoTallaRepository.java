package webintegrado.repository;

import webintegrado.model.ProductoTalla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductoTallaRepository extends JpaRepository<ProductoTalla, Integer> {
    List<ProductoTalla> findByProductoIdProducto(Integer idProducto);
    Optional<ProductoTalla> findByProductoIdProductoAndTalla(Integer idProducto, webintegrado.model.Catalogo.Talla talla);

    @Query("SELECT v FROM ProductoTalla v WHERE v.cantidadDisponible <= v.cantidadMinima")
    List<ProductoTalla> findStockBajoMinimo();

    void deleteByProductoIdProducto(Integer idProducto);
}
