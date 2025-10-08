package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.PlanDTO;

import java.util.List;

public interface PlanMantenimientoService {

    PlanDTO crear(PlanDTO dto);                           // Crea plan
    PlanDTO actualizar(Long id, PlanDTO dto);             // Update parcial
    void eliminar(Long id);                               // Baja plan
    PlanDTO obtener(Long id);                             // Detalle
    List<PlanDTO> listarActivosPorVehiculo(Long vehiculoId); // Activos por vehículo

    // Búsquedas / soporte a alertas
    List<PlanDTO> listarPorVehiculo(Long vehiculoId);
    List<PlanDTO> listarActivos();
    List<PlanDTO> buscarPorNombreLike(String nombre);
    List<PlanDTO> proximosPorKm(Long vehiculoId, int umbralKm);
    List<PlanDTO> vencidosPorKm(Long vehiculoId);
    List<PlanDTO> proximosPorFecha(Long vehiculoId, int umbralDias);
    List<PlanDTO> vencidosPorFecha(Long vehiculoId);
}
