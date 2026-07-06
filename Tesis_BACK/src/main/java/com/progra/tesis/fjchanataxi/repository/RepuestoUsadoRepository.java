package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.model.RepuestoUsado;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repositorio de repuestos usados por tarea.
 */
@Repository
@Transactional
public interface RepuestoUsadoRepository extends JpaRepository<RepuestoUsado, Long> {

    /**
     * Lista todos los repuestos ordenados alfabéticamente.
     * @return lista completa de repuestos
     */
    List<RepuestoUsado> findAllByOrderByDescripcionAsc();

    /**
     * Lista repuestos de una tarea.
     * @param tareaId id de la tarea
     * @return lista de repuestos
     * Uso: detalle de costos por tarea.
     */
    List<RepuestoUsado> findByTareaId(Long tareaId);

    /**
     * Lista repuestos que aún no se asignan a ninguna tarea.
     * @return lista de repuestos libres
     */
    List<RepuestoUsado> findByTareaIsNullOrderByDescripcionAsc();

    /**
     * Lista repuestos asociados a una orden (join por la tarea).
     * @param ordenId id de la orden
     * @return lista de repuestos de todas las tareas de la orden
     * Uso: informe de materiales por orden.
     */
    List<RepuestoUsado> findByTareaOrdenId(Long ordenId);

    /**
     * Calcula el total de repuestos (Σ cantidad*costo_unitario) de una orden.
     * @param ordenId id de la orden
     * @return total monetario de repuestos
     * Uso: validar/recalcular totales de la orden.
     */
    @Query("select coalesce(sum(r.cantidad * r.costoUnitario), 0) " +
            "from RepuestoUsado r where r.tarea.orden.id = :ordenId")
    BigDecimal getMontoRepuestosPorOrden(@Param("ordenId") Long ordenId);
}
