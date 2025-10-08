package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;
import com.progra.tesis.fjchanataxi.dto.TareaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import com.progra.tesis.fjchanataxi.model.RepuestoUsado;
import com.progra.tesis.fjchanataxi.model.Tarea;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RepuestoUsadoRepository;
import com.progra.tesis.fjchanataxi.repository.TareaRepository;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TareaServiceImpl implements TareaService {

    private static final BigDecimal IVA_DEFAULT = new BigDecimal("12.00");

    private final TareaRepository tareaRepository;
    private final OrdenMantenimientoRepository ordenRepository;
    private final UsuarioRepository usuarioRepository;
    private final RepuestoUsadoRepository repuestoRepository;

    @Override
    public TareaDTO crear(Long ordenId, TareaDTO dto) {
        OrdenMantenimiento orden = obtenerOrden(ordenId);
        Tarea tarea = new Tarea();
        tarea.setOrden(orden);
        tarea.setDescripcion(validarDescripcion(dto.getDescripcion()));
        tarea.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoTarea.PENDIENTE);
        tarea.setHoras(dto.getHoras());
        tarea.setCostoManoObra(dto.getCostoManoObra() != null ? dto.getCostoManoObra() : BigDecimal.ZERO);
        if (dto.getAsignadoAId() != null) {
            tarea.setAsignadoA(obtenerUsuario(dto.getAsignadoAId()));
        }
        tarea = tareaRepository.save(tarea);

        if (dto.getRepuestos() != null && !dto.getRepuestos().isEmpty()) {
            for (RepuestoUsadoDTO repuestoDTO : dto.getRepuestos()) {
                tarea.getRepuestos().add(crearRepuesto(tarea, repuestoDTO));
            }
        }

        recalcularTotales(orden);
        ordenRepository.save(orden);
        return toDTO(recargarTarea(tarea.getId()));
    }

    @Override
    public TareaDTO obtener(Long id) {
        return tareaRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
    }

    @Override
    public List<TareaDTO> listarPorOrden(Long ordenId) {
        if (!ordenRepository.existsById(ordenId)) {
            throw new RecursoNoEncontradoException("Orden no encontrada");
        }
        return tareaRepository.findByOrdenId(ordenId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<TareaDTO> listarPorTecnico(Long usuarioId, EstadoTarea estado) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new ReglaNegocioException("El identificador del técnico es obligatorio");
        }
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new RecursoNoEncontradoException("Técnico no encontrado");
        }
        List<Tarea> tareas = (estado != null)
                ? tareaRepository.findByAsignadoAIdAndEstado(usuarioId, estado)
                : tareaRepository.findByAsignadoAId(usuarioId);
        return tareas.stream().map(this::toDTO).toList();
    }

    @Override
    public TareaDTO actualizar(Long id, TareaDTO dto) {
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));

        if (dto.getDescripcion() != null) {
            tarea.setDescripcion(validarDescripcion(dto.getDescripcion()));
        }
        if (dto.getHoras() != null) {
            tarea.setHoras(dto.getHoras());
        }
        if (dto.getCostoManoObra() != null) {
            tarea.setCostoManoObra(dto.getCostoManoObra());
        }
        if (dto.getEstado() != null) {
            tarea.setEstado(dto.getEstado());
        }
        if (dto.getAsignadoAId() != null) {
            tarea.setAsignadoA(obtenerUsuario(dto.getAsignadoAId()));
        }

        tarea = tareaRepository.save(tarea);

        if (dto.getRepuestos() != null) {
            sincronizarRepuestos(tarea, dto.getRepuestos());
        }

        if (dto.getCostoManoObra() != null || dto.getRepuestos() != null) {
            OrdenMantenimiento orden = tarea.getOrden();
            recalcularTotales(orden);
            ordenRepository.save(orden);
        }

        return toDTO(recargarTarea(tarea.getId()));
    }

    @Override
    public TareaDTO actualizarEstado(Long id, EstadoTarea estado) {
        if (estado == null) {
            throw new ReglaNegocioException("El estado es obligatorio");
        }
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
        tarea.setEstado(estado);
        tareaRepository.save(tarea);
        return toDTO(recargarTarea(tarea.getId()));
    }

    @Override
    public TareaDTO actualizarAsignacion(Long id, Long usuarioId) {
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
        if (usuarioId != null) {
            tarea.setAsignadoA(obtenerUsuario(usuarioId));
        } else {
            tarea.setAsignadoA(null);
        }
        tareaRepository.save(tarea);
        return toDTO(recargarTarea(tarea.getId()));
    }

    @Override
    public void eliminar(Long id) {
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
        OrdenMantenimiento orden = tarea.getOrden();
        tareaRepository.delete(tarea);
        recalcularTotales(orden);
        ordenRepository.save(orden);
    }

    @Override
    public long contarPorOrden(Long ordenId) {
        if (!ordenRepository.existsById(ordenId)) {
            throw new RecursoNoEncontradoException("Orden no encontrada");
        }
        return tareaRepository.countByOrdenId(ordenId);
    }

    private OrdenMantenimiento obtenerOrden(Long ordenId) {
        if (ordenId == null || ordenId <= 0) {
            throw new ReglaNegocioException("El identificador de la orden es obligatorio");
        }
        return ordenRepository.findById(ordenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new ReglaNegocioException("El identificador del usuario es obligatorio");
        }
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private String validarDescripcion(String descripcion) {
        if (descripcion == null || descripcion.trim().isEmpty()) {
            throw new ReglaNegocioException("La descripción de la tarea es obligatoria");
        }
        return descripcion.trim();
    }

    private RepuestoUsado crearRepuesto(Tarea tarea, RepuestoUsadoDTO dto) {
        if (dto.getDescripcion() == null || dto.getDescripcion().trim().isEmpty()) {
            throw new ReglaNegocioException("La descripción del repuesto es obligatoria");
        }
        if (dto.getCantidad() == null) {
            throw new ReglaNegocioException("La cantidad del repuesto es obligatoria");
        }
        if (dto.getCostoUnitario() == null) {
            throw new ReglaNegocioException("El costo unitario del repuesto es obligatorio");
        }
        RepuestoUsado repuesto = new RepuestoUsado();
        repuesto.setTarea(tarea);
        repuesto.setDescripcion(dto.getDescripcion().trim());
        repuesto.setCantidad(dto.getCantidad());
        repuesto.setCostoUnitario(dto.getCostoUnitario());
        return repuestoRepository.save(repuesto);
    }

    private void sincronizarRepuestos(Tarea tarea, List<RepuestoUsadoDTO> repuestosDto) {
        List<Long> idsEnviados = new ArrayList<>();
        for (RepuestoUsadoDTO dto : repuestosDto) {
            if (dto.getId() != null) {
                idsEnviados.add(dto.getId());
            }
        }

        List<RepuestoUsado> actuales = repuestoRepository.findByTareaId(tarea.getId());
        for (RepuestoUsado actual : actuales) {
            if (!idsEnviados.contains(actual.getId())) {
                repuestoRepository.delete(actual);
            }
        }

        for (RepuestoUsadoDTO dto : repuestosDto) {
            if (dto.getId() == null) {
                crearRepuesto(tarea, dto);
            } else {
                RepuestoUsado existente = actuales.stream()
                        .filter(rep -> rep.getId().equals(dto.getId()))
                        .findFirst()
                        .orElseThrow(() -> new RecursoNoEncontradoException("Repuesto no encontrado"));
                if (dto.getDescripcion() != null) {
                    existente.setDescripcion(dto.getDescripcion().trim());
                }
                if (dto.getCantidad() != null) {
                    existente.setCantidad(dto.getCantidad());
                }
                if (dto.getCostoUnitario() != null) {
                    existente.setCostoUnitario(dto.getCostoUnitario());
                }
                repuestoRepository.save(existente);
            }
        }
    }

    private void recalcularTotales(OrdenMantenimiento orden) {
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
    }

    private BigDecimal nvl(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }

    private Tarea recargarTarea(Long tareaId) {
        return tareaRepository.findById(tareaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
    }

    private TareaDTO toDTO(Tarea tarea) {
        List<RepuestoUsadoDTO> repuestos = repuestoRepository.findByTareaId(tarea.getId()).stream()
                .map(this::toDTO)
                .toList();
        Usuario asignado = tarea.getAsignadoA();
        return TareaDTO.builder()
                .id(tarea.getId())
                .ordenId(tarea.getOrden() != null ? tarea.getOrden().getId() : null)
                .asignadoAId(asignado != null ? asignado.getId() : null)
                .asignadoANombre(asignado != null ? asignado.getNombre() + " " + asignado.getApellido() : null)
                .estado(tarea.getEstado())
                .descripcion(tarea.getDescripcion())
                .horas(tarea.getHoras())
                .costoManoObra(tarea.getCostoManoObra())
                .repuestos(repuestos)
                .build();
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

