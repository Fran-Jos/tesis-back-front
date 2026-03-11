package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Transactional
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    Optional<Vehiculo> findByPlacaIgnoreCase(String placa);
    boolean existsByPlacaIgnoreCase(String placa);
    List<Vehiculo> findByEstado(EstadoVehiculo estado);
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

