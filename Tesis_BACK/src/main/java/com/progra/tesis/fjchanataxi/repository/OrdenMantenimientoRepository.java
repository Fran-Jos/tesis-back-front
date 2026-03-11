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

@Repository
@Transactional
public interface OrdenMantenimientoRepository extends JpaRepository<OrdenMantenimiento, Long> {

    Optional<OrdenMantenimiento> findByCodigo(String codigo);
     // Lista órdenes de un vehículo, ordenadas por fecha de apertura descendente.
    List<OrdenMantenimiento> findByVehiculoIdOrderByFechaAperturaDesc(Long vehiculoId);
    List<OrdenMantenimiento> findByPlanIdOrderByFechaAperturaDesc(Long planId);
    List<OrdenMantenimiento> findByEstadoOrderByFechaAperturaDesc(EstadoOrden estado);
    List<OrdenMantenimiento> findByTipoOrderByFechaAperturaDesc(com.progra.tesis.fjchanataxi.enums.TipoOrden tipo);
    List<OrdenMantenimiento> findByResponsableIdOrderByFechaAperturaDesc(Long responsableId);
    List<OrdenMantenimiento> findByResponsableIdAndEstadoOrderByFechaAperturaDesc(Long responsableId, EstadoOrden estado);
    List<OrdenMantenimiento> findByFechaAperturaBetweenOrderByFechaAperturaDesc(LocalDateTime desde, LocalDateTime hasta);
    List<OrdenMantenimiento> findByEstadoAndFechaAperturaBetweenOrderByFechaAperturaDesc(EstadoOrden estado, LocalDateTime desde, LocalDateTime hasta);

    List<OrdenMantenimiento> findByVehiculoIdAndEstadoIn(Long vehiculoId, Collection<EstadoOrden> estados);

    long countByVehiculoId(Long vehiculoId);

    long countByVehiculoIdAndEstadoIn(Long vehiculoId, Collection<EstadoOrden> estados);

    Page<OrdenMantenimiento> findByEstado(EstadoOrden estado, Pageable pageable);
    List<OrdenMantenimiento> findByFechaAperturaBetween(LocalDateTime desde, LocalDateTime hasta);
    Optional<OrdenMantenimiento> findTopByPlanIdAndEstadoOrderByFechaCierreDesc(Long planId, EstadoOrden estado);


    @Query("select coalesce(sum(t.costoManoObra), 0) from Tarea t where t.orden.id = :ordenId")
    BigDecimal getSumaManoObra(Long ordenId);

    @Query("select coalesce(sum(r.cantidad * r.costoUnitario), 0) " +
            "from RepuestoUsado r where r.tarea.orden.id = :ordenId")
    BigDecimal getSumaRepuestos(Long ordenId);

    long countByPlanId(Long planId);
    long countByPlanIdAndEstadoIn(Long planId, Collection<EstadoOrden> estados);
    long countByCreadoPorId(Long usuarioId);
    long countByResponsableId(Long usuarioId);
    long countByResponsableIdAndEstadoIn(Long usuarioId, Collection<EstadoOrden> estados);
}
