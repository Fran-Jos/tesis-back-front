package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.model.Alerta;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de alertas (preventivas por km/fecha y correctivas).
 */
@Repository
@Transactional
public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    /**
     * Lista alertas por vehículo y estado (ej. PENDIENTE), ordenadas por fecha programada ascendente.
     * @param vehiculoId id del vehículo
     * @param estado estado de la alerta
     * @return lista de alertas
     * Uso: bandeja de pendientes por unidad.
     */
    List<Alerta> findByVehiculoIdAndEstadoOrderByFechaProgramadaAsc(Long vehiculoId, EstadoAlerta estado);

    List<Alerta> findByVehiculoIdOrderByFechaProgramadaAsc(Long vehiculoId);

    List<Alerta> findByPlanIdOrderByFechaProgramadaAsc(Long planId);

    List<Alerta> findByEstadoOrderByFechaProgramadaAsc(EstadoAlerta estado);

    List<Alerta> findByTipoOrderByFechaProgramadaAsc(TipoAlerta tipo);

    List<Alerta> findByClasificacionOrderByFechaProgramadaAsc(ClasificacionAlerta clasificacion);

    /**
     * Verifica si ya existe una alerta con mismo vehículo, plan, tipo y estado.
     * @param vehiculoId id del vehículo
     * @param planId id del plan (puede ser null si no aplica)
     * @param tipo tipo de alerta (KILOMETRAJE/FECHA/CORRECTIVO)
     * @param estado estado (típicamente PENDIENTE)
     * @return true si existe una alerta similar
     * Uso: evitar alertas duplicadas pendientes.
     */
    boolean existsByVehiculoIdAndPlanIdAndTipoAndEstado(Long vehiculoId, Long planId, TipoAlerta tipo, EstadoAlerta estado);

    /**
     * Obtiene la última alerta (por fechaProgramada) coincidente con vehículo/plan/tipo/estado.
     * @param vehiculoId id del vehículo
     * @param planId id del plan
     * @param tipo tipo de alerta
     * @param estado estado de la alerta
     * @return Optional con la última alerta
     * Uso: actualizar PRÓXIMA -> VENCIDA en la misma alerta.
     */
    Optional<Alerta> findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
            Long vehiculoId, Long planId, TipoAlerta tipo, EstadoAlerta estado);

    /**
     * Lista alertas filtrando además por clasificación técnica (PROXIMA/VENCIDA).
     * @param vehiculoId id del vehículo
     * @param planId id del plan
     * @param tipo tipo de alerta
     * @param clasificacion PROXIMA o VENCIDA
     * @param estado estado (ej. PENDIENTE)
     * @return lista de alertas
     */
    List<Alerta> findByVehiculoIdAndPlanIdAndTipoAndClasificacionAndEstado(
            Long vehiculoId, Long planId, TipoAlerta tipo, ClasificacionAlerta clasificacion, EstadoAlerta estado);

    /**
     * Lista alertas en un estado (ej. PENDIENTE) cuya fecha programada sea menor o igual a la indicada.
     * @param estado estado de la alerta
     * @param fecha fecha límite (usualmente hoy)
     * @return lista de alertas
     * Uso: job diario para FECHA (crear/actualizar vencidas).
     */
    List<Alerta> findByEstadoAndFechaProgramadaLessThanEqual(EstadoAlerta estado, LocalDate fecha);

    List<Alerta> findByEstadoAndFechaProgramadaBeforeOrderByFechaProgramadaAsc(EstadoAlerta estado, LocalDate fecha);

    List<Alerta> findByEstadoAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(EstadoAlerta estado, LocalDate desde, LocalDate hasta);

    List<Alerta> findByFechaProgramadaBetweenOrderByFechaProgramadaAsc(LocalDate desde, LocalDate hasta);

    List<Alerta> findByVehiculoIdAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(Long vehiculoId, LocalDate desde, LocalDate hasta);

    List<Alerta> findByVehiculoIdAndEstadoAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(Long vehiculoId, EstadoAlerta estado, LocalDate desde, LocalDate hasta);

    /**
     * Lista alertas que ya fueron atendidas por una orden específica.
     * @param ordenId id de la orden que atendió
     * @return lista de alertas atendidas por esa orden
     * Uso: informes y trazabilidad.
     */
    List<Alerta> findByOrdenAtendidaId(Long ordenId);
}
