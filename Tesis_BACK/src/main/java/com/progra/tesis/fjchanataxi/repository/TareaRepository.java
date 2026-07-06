package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.model.Tarea;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de tareas dentro de una orden.
 */
@Repository
@Transactional
public interface TareaRepository extends JpaRepository<Tarea, Long> {

    /**
     * Lista todas las tareas de una orden.
     * @param ordenId id de la orden
     * @return lista de tareas
     * Uso: detalle de orden y cálculo de totales.
     */
    List<Tarea> findByOrdenId(Long ordenId);

    /**
     * Lista tareas asignadas a un técnico en un estado específico.
     * @param usuarioId id del técnico
     * @param estado estado de la tarea (PENDIENTE/OK/NOK)
     * @return lista de tareas
     * Uso: tablero de trabajo por técnico.
     */
    List<Tarea> findByAsignadoAIdAndEstado(Long usuarioId, EstadoTarea estado);

    /**
     * Lista tareas asignadas a un técnico sin filtrar por estado.
     * @param usuarioId id del técnico
     * @return lista de tareas asignadas
     */
    List<Tarea> findByAsignadoAId(Long usuarioId);

    /**
     * Cuenta cuántas tareas tiene una orden.
     * @param ordenId id de la orden
     * @return cantidad de tareas
     * Uso: métricas y validaciones.
     */
    long countByOrdenId(Long ordenId);

    /**
     * Lista todas las tareas ordenadas alfabéticamente por nombre.
     * @return lista de tareas
     */
    List<Tarea> findAllByOrderByNombreAsc();

    /**
     * Busca tareas cuyo nombre contenga una cadena.
     * @param nombre texto a buscar
     * @return lista limitada de tareas
     */
    List<Tarea> findTop20ByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

    long countByAsignadoAId(Long usuarioId);
}
