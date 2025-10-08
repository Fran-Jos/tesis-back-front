package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de vehículos (tráiler/cabezal).
 */
@Repository
@Transactional
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    /**
     * Busca un vehículo por placa (única).
     * @param placa placa exacta
     * @return Optional con el vehículo si existe
     */

    Optional<Vehiculo> findByPlacaIgnoreCase(String placa);
    /**
     * Verifica si ya existe un vehículo con la placa indicada.
     * @param placa placa a validar
     * @return true si existe
     */
    boolean existsByPlacaIgnoreCase(String placa);

    /**
     * Lista vehículos por estado (ACTIVO/INACTIVO).
     * @param estado estado a filtrar
     * @return lista de vehículos
     */
    List<Vehiculo> findByEstado(EstadoVehiculo estado);

    /**
     * Búsqueda parcial por placa (contiene, case-insensitive).
     * @param placa fragmento de placa
     * @return lista de vehículos coincidentes
     */
    List<Vehiculo> findByPlacaContainingIgnoreCase(String placa);

    Optional<Vehiculo> findByChasisIgnoreCase(String chasis);

    List<Vehiculo> findByMarcaContainingIgnoreCase(String marca);

    List<Vehiculo> findByModeloContainingIgnoreCase(String modelo);

    List<Vehiculo> findByMarcaContainingIgnoreCaseAndModeloContainingIgnoreCase(String marca, String modelo);

    List<Vehiculo> findByAnioBetween(int desde, int hasta);

    @Query("select v from Vehiculo v where " +
            "lower(v.placa) like lower(concat('%', :token, '%')) or " +
            "lower(v.marca) like lower(concat('%', :token, '%')) or " +
            "lower(v.modelo) like lower(concat('%', :token, '%')) or " +
            "lower(v.chasis) like lower(concat('%', :token, '%'))")
    List<Vehiculo> searchPlacaMarcaModeloChasis(String token);
}

