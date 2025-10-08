package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.model.PlanMantenimiento;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de planes de mantenimiento preventivo por vehículo.
 */
@Repository
@Transactional
public interface PlanMantenimientoRepository extends JpaRepository<PlanMantenimiento, Long> {

    /**
     * Lista los planes ACTIVOS de un vehículo.
     * @param vehiculoId id del vehículo
     * @return lista de planes activos
     * Uso: evaluación de alertas preventivas.
     */
    List<PlanMantenimiento> findByVehiculoIdAndActivoTrue(Long vehiculoId);

    /**
     * Lista todos los planes ACTIVOS del sistema.
     * @return lista de planes activos
     * Uso: jobs diarios/semanales por fecha.
     */
    List<PlanMantenimiento> findByActivoTrue();

    List<PlanMantenimiento> findByVehiculoId(Long vehiculoId);

    List<PlanMantenimiento> findByNombreContainingIgnoreCase(String nombre);

    /**
     * Busca un plan por id perteneciente a un vehículo específico.
     * @param id id del plan
     * @param vehiculoId id del vehículo
     * @return Optional con el plan si existe
     * Uso: validar pertenencia antes de operar.
     */
    Optional<PlanMantenimiento> findByIdAndVehiculoId(Long id, Long vehiculoId);

    /**
     * Busca planes activos cuya próxima fecha esté dentro de un rango.
     * @param desde fecha inicial (incluida)
     * @param hasta fecha final (incluida)
     * @return lista de planes
     * Uso: generar alertas PRÓXIMAS por FECHA.
     */
    List<PlanMantenimiento> findByActivoTrueAndProximaFechaBetween(LocalDate desde, LocalDate hasta);

    /**
     * Busca planes activos cuya próxima fecha sea hoy o ya haya vencido.
     * @param fecha fecha límite (hoy)
     * @return lista de planes vencidos por fecha
     * Uso: generar/actualizar alertas VENCIDAS por FECHA.
     */
    List<PlanMantenimiento> findByActivoTrueAndProximaFechaLessThanEqual(LocalDate fecha);
}
