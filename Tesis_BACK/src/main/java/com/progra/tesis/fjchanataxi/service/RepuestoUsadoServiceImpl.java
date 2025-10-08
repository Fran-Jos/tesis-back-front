package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import com.progra.tesis.fjchanataxi.model.RepuestoUsado;
import com.progra.tesis.fjchanataxi.model.Tarea;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RepuestoUsadoRepository;
import com.progra.tesis.fjchanataxi.repository.TareaRepository;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Implementación de la lógica de negocio para los repuestos usados en las tareas.
 */
@Service
@RequiredArgsConstructor
public class RepuestoUsadoServiceImpl implements RepuestoUsadoService {

    private static final BigDecimal IVA_DEFAULT = new BigDecimal("12.00");

    private final RepuestoUsadoRepository repuestoRepository;
    private final TareaRepository tareaRepository;
    private final OrdenMantenimientoRepository ordenRepository;

    @Override
    public RepuestoUsadoDTO crear(Long tareaId, RepuestoUsadoDTO dto) {
        Tarea tarea = obtenerTarea(tareaId);
        RepuestoUsado repuesto = new RepuestoUsado();
        repuesto.setTarea(tarea);
        repuesto.setDescripcion(validarDescripcion(dto.getDescripcion()));
        repuesto.setCantidad(validarCantidad(dto.getCantidad()));
        repuesto.setCostoUnitario(validarCosto(dto.getCostoUnitario()));

        RepuestoUsado guardado = repuestoRepository.save(repuesto);
        actualizarTotalesOrden(tarea.getOrden());
        return toDTO(guardado);
    }

    @Override
    public RepuestoUsadoDTO obtener(Long id) {
        return repuestoRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Repuesto no encontrado"));
    }

    @Override
    public List<RepuestoUsadoDTO> listarPorTarea(Long tareaId) {
        if (!tareaRepository.existsById(tareaId)) {
            throw new RecursoNoEncontradoException("Tarea no encontrada");
        }
        return repuestoRepository.findByTareaId(tareaId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public List<RepuestoUsadoDTO> listarPorOrden(Long ordenId) {
        if (!ordenRepository.existsById(ordenId)) {
            throw new RecursoNoEncontradoException("Orden no encontrada");
        }
        return repuestoRepository.findByTareaOrdenId(ordenId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public RepuestoUsadoDTO actualizar(Long id, RepuestoUsadoDTO dto) {
        RepuestoUsado repuesto = repuestoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Repuesto no encontrado"));

        if (dto.getDescripcion() != null) {
            repuesto.setDescripcion(validarDescripcion(dto.getDescripcion()));
        }
        if (dto.getCantidad() != null) {
            repuesto.setCantidad(validarCantidad(dto.getCantidad()));
        }
        if (dto.getCostoUnitario() != null) {
            repuesto.setCostoUnitario(validarCosto(dto.getCostoUnitario()));
        }

        RepuestoUsado actualizado = repuestoRepository.save(repuesto);
        actualizarTotalesOrden(repuesto.getTarea().getOrden());
        return toDTO(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        RepuestoUsado repuesto = repuestoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Repuesto no encontrado"));
        OrdenMantenimiento orden = repuesto.getTarea().getOrden();
        repuestoRepository.delete(repuesto);
        actualizarTotalesOrden(orden);
    }

    @Override
    public BigDecimal totalPorOrden(Long ordenId) {
        if (!ordenRepository.existsById(ordenId)) {
            throw new RecursoNoEncontradoException("Orden no encontrada");
        }
        return nvl(repuestoRepository.getMontoRepuestosPorOrden(ordenId));
    }

    private void actualizarTotalesOrden(OrdenMantenimiento orden) {
        if (orden == null || orden.getId() == null) {
            return;
        }
        BigDecimal manoObra = nvl(ordenRepository.getSumaManoObra(orden.getId()));
        BigDecimal repuestos = nvl(ordenRepository.getSumaRepuestos(orden.getId()));
        BigDecimal subtotal = manoObra.add(repuestos);

        BigDecimal ivaPorc = (orden.getIvaPorc() == null || orden.getIvaPorc().compareTo(BigDecimal.ZERO) == 0)
                ? IVA_DEFAULT : orden.getIvaPorc();
        BigDecimal ivaValor = subtotal.multiply(ivaPorc).divide(new BigDecimal("100"));

        orden.setTotalManoObra(manoObra);
        orden.setTotalRepuestos(repuestos);
        orden.setSubtotal(subtotal);
        orden.setIvaPorc(ivaPorc);
        orden.setIvaValor(ivaValor);
        orden.setTotal(subtotal.add(ivaValor));
        ordenRepository.save(orden);
    }

    private Tarea obtenerTarea(Long tareaId) {
        if (tareaId == null || tareaId <= 0) {
            throw new ReglaNegocioException("El identificador de la tarea es obligatorio");
        }
        return tareaRepository.findById(tareaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
    }

    private String validarDescripcion(String descripcion) {
        if (descripcion == null || descripcion.trim().isEmpty()) {
            throw new ReglaNegocioException("La descripción del repuesto es obligatoria");
        }
        return descripcion.trim();
    }

    private BigDecimal validarCantidad(BigDecimal cantidad) {
        if (cantidad == null) {
            throw new ReglaNegocioException("La cantidad del repuesto es obligatoria");
        }
        return cantidad;
    }

    private BigDecimal validarCosto(BigDecimal costoUnitario) {
        if (costoUnitario == null) {
            throw new ReglaNegocioException("El costo unitario del repuesto es obligatorio");
        }
        return costoUnitario;
    }

    private BigDecimal nvl(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }

    private RepuestoUsadoDTO toDTO(RepuestoUsado repuesto) {
        return RepuestoUsadoDTO.builder()
                .id(repuesto.getId())
                .tareaId(repuesto.getTarea() != null ? repuesto.getTarea().getId() : null)
                .descripcion(repuesto.getDescripcion())
                .cantidad(repuesto.getCantidad())
                .costoUnitario(repuesto.getCostoUnitario())
                .build();
    }
}