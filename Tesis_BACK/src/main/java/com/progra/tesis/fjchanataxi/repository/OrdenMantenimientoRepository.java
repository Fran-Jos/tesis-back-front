package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de órdenes de mantenimiento (preventivas/correctivas).
 */
@Repository
@Transactional
public interface OrdenMantenimientoRepository extends JpaRepository<OrdenMantenimiento, Long> {

    /**
     * Busca una orden por su código único (ej. OM-2025-0042).
     * @param codigo código de la orden
     * @return Optional con la orden si existe
     * Uso: consultas rápidas desde UI o integración.
     */
    Optional<OrdenMantenimiento> findByCodigo(String codigo);

    /**
     * Lista órdenes de un vehículo, ordenadas por fecha de apertura descendente.
     * @param vehiculoId id del vehículo
     * @return lista de órdenes
     * Uso: historial por unidad.
     */
    List<OrdenMantenimiento> findByVehiculoIdOrderByFechaAperturaDesc(Long vehiculoId);

    List<OrdenMantenimiento> findByPlanIdOrderByFechaAperturaDesc(Long planId);

    List<OrdenMantenimiento> findByEstadoOrderByFechaAperturaDesc(EstadoOrden estado);

    List<OrdenMantenimiento> findByTipoOrderByFechaAperturaDesc(com.progra.tesis.fjchanataxi.enums.TipoOrden tipo);

    List<OrdenMantenimiento> findByResponsableIdOrderByFechaAperturaDesc(Long responsableId);

    List<OrdenMantenimiento> findByResponsableIdAndEstadoOrderByFechaAperturaDesc(Long responsableId, EstadoOrden estado);

    List<OrdenMantenimiento> findByFechaAperturaBetweenOrderByFechaAperturaDesc(LocalDateTime desde, LocalDateTime hasta);

    List<OrdenMantenimiento> findByEstadoAndFechaAperturaBetweenOrderByFechaAperturaDesc(EstadoOrden estado, LocalDateTime desde, LocalDateTime hasta);

    /**
     * Lista órdenes de un vehículo filtradas por varios estados.
     * @param vehiculoId id del vehículo
     * @param estados colección de estados (ABIERTA, EN_PROCESO, etc.)
     * @return lista de órdenes
     * Uso: panel de seguimiento por unidad.
     */
    List<OrdenMantenimiento> findByVehiculoIdAndEstadoIn(Long vehiculoId, Collection<EstadoOrden> estados);

    /**
     * Página de órdenes por estado (con paginación/orden).
     * @param estado estado de la orden
     * @param pageable paginación/orden
     * @return página de órdenes
     * Uso: listados grandes con filtros.
     */
    Page<OrdenMantenimiento> findByEstado(EstadoOrden estado, Pageable pageable);

    /**
     * Lista órdenes cuya fecha de apertura esté en un rango.
     * @param desde fecha/hora inicio (incluida)
     * @param hasta fecha/hora fin (incluida)
     * @return lista de órdenes
     * Uso: informes por periodo.
     */
    List<OrdenMantenimiento> findByFechaAperturaBetween(LocalDateTime desde, LocalDateTime hasta);

    /**
     * Obtiene la última orden CERRADA de un plan (por fecha de cierre).
     * @param planId id del plan
     * @param estado estado esperado (CERRADA)
     * @return Optional con la última orden cerrada del plan
     * Uso: recalcular proximoKm/proximaFecha.
     */
    Optional<OrdenMantenimiento> findTopByPlanIdAndEstadoOrderByFechaCierreDesc(Long planId, EstadoOrden estado);

    /**
     * Suma de mano de obra (Σ costo_mano_obra) de las tareas de una orden.
     * @param ordenId id de la orden
     * @return total de mano de obra
     * Uso: validar/recalcular totales persistidos en orden.
     */
    @Query("select coalesce(sum(t.costoManoObra), 0) from Tarea t where t.orden.id = :ordenId")
    BigDecimal getSumaManoObra(Long ordenId);

    /**
     * Suma de repuestos (Σ cantidad * costo_unitario) usados en las tareas de una orden.
     * @param ordenId id de la orden
     * @return total de repuestos
     * Uso: validar/recalcular totales persistidos en orden.
     */
    @Query("select coalesce(sum(r.cantidad * r.costoUnitario), 0) " +
            "from RepuestoUsado r where r.tarea.orden.id = :ordenId")
    BigDecimal getSumaRepuestos(Long ordenId);
}
