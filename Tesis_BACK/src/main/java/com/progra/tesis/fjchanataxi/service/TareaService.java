package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.TareaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;

import java.util.List;

/**
 * Operaciones de negocio para las tareas asociadas a una orden de mantenimiento.
 */
public interface TareaService {

    TareaDTO crear(Long ordenId, TareaDTO dto);                  // Alta ligada a una orden
    TareaDTO obtener(Long id);                                   // Detalle de tarea
    List<TareaDTO> listar(String nombre);                        // Listado general (filtro por nombre)
    List<TareaDTO> listarPorOrden(Long ordenId);                 // Tareas por orden
    List<TareaDTO> listarPorTecnico(Long usuarioId, EstadoTarea estado); // Tareas de un técnico
    TareaDTO actualizar(Long id, TareaDTO dto);                  // Actualización parcial
    TareaDTO actualizarEstado(Long id, EstadoTarea estado);      // Cambiar estado rápido
    TareaDTO actualizarAsignacion(Long id, Long usuarioId);      // Asignar/desasignar técnico
    void eliminar(Long id);                                      // Baja
    long contarPorOrden(Long ordenId);                           // Métrica rápida
}

