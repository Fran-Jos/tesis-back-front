package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.*;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;

import java.time.LocalDateTime;
import java.util.List;

public interface OrdenMantenimientoService {

    // CRUD principal de la OM
    OrdenDTO crear(OrdenDTO dto);                                // Crear OM (con o sin tareas)
    OrdenDTO obtener(Long id);                                   // Detalle
    List<OrdenDTO> listar();                                     // Listado
    void eliminar(Long id);                                               // Eliminar OM (si negocio lo permite)

    // Tareas y repuestos
    TareaDTO agregarTarea(Long ordenId, TareaDTO dto);           // Añadir tarea
    RepuestoUsadoDTO agregarRepuesto(Long tareaId, RepuestoUsadoDTO dto); // Añadir repuesto a tarea
    OrdenDTO cerrar(Long ordenId, OrdenDTO dto);           // Cerrar OM (recalcula totales, atiende alertas)

    // Búsquedas
    OrdenDTO buscarPorCodigoExacto(String codigo);
    List<OrdenDTO> listarPorVehiculo(Long vehiculoId);
    List<OrdenDTO> listarPorPlan(Long planId);
    List<OrdenDTO> listarPorEstado(EstadoOrden estado);
    List<OrdenDTO> listarPorTipo(TipoOrden tipo);
    List<OrdenDTO> listarPorResponsable(Long usuarioId, EstadoOrden soloEstado);
    List<OrdenDTO> listarPorRangoApertura(LocalDateTime desde, LocalDateTime hasta, EstadoOrden estado);

    // Resumen de totales
    OrdenDTO resumenTotalesPorRango(LocalDateTime desde, LocalDateTime hasta, EstadoOrden estado);

    // Reportes detallados
    List<ReporteMantenimientoDetalladoDTO> generarReporteDetallado(LocalDateTime desde, LocalDateTime hasta,
                                                                   Long vehiculoId, EstadoOrden estado);

    byte[] generarReporteDetalladoPdf(LocalDateTime desde, LocalDateTime hasta, Long vehiculoId, EstadoOrden estado);

    FacturaOrdenDTO generarFactura(Long ordenId);

    ReporteMantenimientoDetalladoDTO generarReporteDetalladoPorCodigo(String codigo);
}
