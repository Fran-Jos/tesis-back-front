package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.model.RegistroKilometraje;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de registros de odómetro por vehículo.
 */
@Repository
@Transactional
public interface RegistroKilometrajeRepository extends JpaRepository<RegistroKilometraje, Long> {

    /**
     * Obtiene el histórico de registros de un vehículo, ordenado de más reciente a más antiguo.
     * @param vehiculoId id del vehículo
     * @return lista ordenada desc por fecha
     */
    List<RegistroKilometraje> findByVehiculoIdOrderByFechaDesc(Long vehiculoId);

    List<RegistroKilometraje> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    /**
     * Obtiene el último registro (más reciente) de un vehículo.
     * @param vehiculoId id del vehículo
     * @return Optional con el último registro si existe
     * Uso típico: calcular próximos hitos del plan.
     */
    Optional<RegistroKilometraje> findTopByVehiculoIdOrderByFechaDesc(Long vehiculoId);
    Optional<RegistroKilometraje> findFirstByVehiculoIdOrderByFechaDesc(Long vehiculoId);

    /**
     * Verifica si ya existe un registro para el vehículo en la fecha/hora exacta.
     * @param vehiculoId id del vehículo
     * @param fecha fecha/hora a validar
     * @return true si existe
     * Uso: evitar duplicados exactos.
     */
    boolean existsByVehiculoIdAndFecha(Long vehiculoId, LocalDateTime fecha);

    /**
     * Obtiene registros dentro de un rango de fechas, ordenados ascendentemente.
     * @param vehiculoId id del vehículo
     * @param inicio fecha/hora inicio (incluida)
     * @param fin fecha/hora fin (incluida)
     * @return lista de registros
     * Uso: reportes de consumo/uso por periodo.
     */
    List<RegistroKilometraje> findByVehiculoIdAndFechaBetweenOrderByFechaAsc(
            Long vehiculoId, LocalDateTime inicio, LocalDateTime fin);

    List<RegistroKilometraje> findByVehiculoIdAndFechaBetweenOrderByFechaDesc(
            Long vehiculoId, LocalDateTime inicio, LocalDateTime fin);

    /**
     * Obtiene el registro con mayor odómetro (ayuda a detectar regresión de odómetro).
     * @param vehiculoId id del vehículo
     * @return Optional con el registro de mayor odómetro
     */
    Optional<RegistroKilometraje> findTopByVehiculoIdOrderByOdometroDesc(Long vehiculoId);
}
