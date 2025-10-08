package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;

import java.math.BigDecimal;
import java.util.List;

/**
 * Operaciones de negocio para la gestión de repuestos usados en las tareas.
 */
public interface RepuestoUsadoService {

    RepuestoUsadoDTO crear(Long tareaId, RepuestoUsadoDTO dto);            // Alta ligada a una tarea
    RepuestoUsadoDTO obtener(Long id);                                     // Detalle del repuesto
    List<RepuestoUsadoDTO> listarPorTarea(Long tareaId);                   // Repuestos de una tarea
    List<RepuestoUsadoDTO> listarPorOrden(Long ordenId);                   // Repuestos de todas las tareas de una orden
    RepuestoUsadoDTO actualizar(Long id, RepuestoUsadoDTO dto);            // Actualización parcial
    void eliminar(Long id);                                                // Baja
    BigDecimal totalPorOrden(Long ordenId);                                 // Total monetario por orden
}