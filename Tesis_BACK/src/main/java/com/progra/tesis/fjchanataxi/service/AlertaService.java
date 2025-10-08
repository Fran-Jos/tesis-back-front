package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.AlertaDTO;

import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;

import java.time.LocalDate;
import java.util.List;

public interface AlertaService {

    AlertaDTO upsert(AlertaDTO dto);                    // Crear/actualizar manual
    AlertaDTO cambiarEstado(Long id, AlertaDTO dto); // Cambia a ATENDIDA/CANCELADA y puede asociar orden
    void eliminar(Long id);                                      // Elimina alerta
    AlertaDTO obtener(Long id);                         // Detalle
    List<AlertaDTO> listarPendientesPorVehiculo(Long vehiculoId);

    // Búsquedas
    List<AlertaDTO> listarPorVehiculo(Long vehiculoId);
    List<AlertaDTO> listarPorPlan(Long planId);
    List<AlertaDTO> listarPorEstado(EstadoAlerta estado);
    List<AlertaDTO> listarPorTipo(TipoAlerta tipo);
    List<AlertaDTO> listarPorClasificacion(ClasificacionAlerta clasif);
    List<AlertaDTO> vencidasHoy();                      // fecha < hoy y PENDIENTE
    List<AlertaDTO> proximasEnDias(int diasUmbral);     // hoy..hoy+umbral y PENDIENTE
    List<AlertaDTO> buscarPorRangoFecha(LocalDate desde, LocalDate hasta, EstadoAlerta estado);
    List<AlertaDTO> buscarPorVehiculoYRango(Long vehiculoId, LocalDate desde, LocalDate hasta, EstadoAlerta estado);
}
