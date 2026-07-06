package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;
import com.progra.tesis.fjchanataxi.dto.TareaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import com.progra.tesis.fjchanataxi.model.RepuestoUsado;
import com.progra.tesis.fjchanataxi.model.Tarea;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RepuestoUsadoRepository;
import com.progra.tesis.fjchanataxi.repository.TareaRepository;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import com.progra.tesis.fjchanataxi.security.UserPrincipal;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TareaServiceImpl implements TareaService {

    private static final BigDecimal IVA_DEFAULT = new BigDecimal("12.00");
    private static final Locale LOCALE_ES_EC = new Locale("es", "EC");

    private final TareaRepository tareaRepository;
    private final OrdenMantenimientoRepository ordenRepository;
    private final UsuarioRepository usuarioRepository;
    private final RepuestoUsadoRepository repuestoRepository;

    @Override
    public TareaDTO crear(Long ordenId, TareaDTO dto) {
        OrdenMantenimiento orden = obtenerOrden(ordenId);
        Tarea tarea = new Tarea();
        tarea.setOrden(orden);
        tarea.setNombre(validarNombre(dto.getNombre(), dto.getDescripcion()));
        tarea.setDescripcion(validarDescripcion(dto.getDescripcion()));
        tarea.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoTarea.PENDIENTE);
        tarea.setHoras(dto.getHoras());
        tarea.setCostoManoObra(dto.getCostoManoObra() != null ? dto.getCostoManoObra() : BigDecimal.ZERO);
        tarea.setAsignadoA(obtenerUsuarioAsignado(dto.getAsignadoAId()));
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
    public List<TareaDTO> listar(String nombre) {
        List<Tarea> tareas;
        if (nombre != null && !nombre.trim().isEmpty()) {
            tareas = tareaRepository.findTop20ByNombreContainingIgnoreCaseOrderByNombreAsc(nombre.trim());
        } else {
            tareas = tareaRepository.findAllByOrderByNombreAsc();
        }
        return tareas.stream().map(this::toDTO).toList();
    }

    @Override
    public List<TareaDTO> listarParaSelector(String busqueda) {
        String filtro = normalizarBusqueda(busqueda);
        return tareaRepository.findAll().stream()
                .filter(tarea -> filtro.isBlank() || coincideBusquedaSelector(tarea, filtro))
                .sorted(Comparator
                        .comparing((Tarea tarea) -> prioridadOrden(tarea.getOrden()))
                        .thenComparing(tarea -> prioridadTarea(tarea.getEstado()))
                        .thenComparing(tarea -> tarea.getOrden() != null ? tarea.getOrden().getFechaApertura() : null,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDTO)
                .toList();
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
        if (dto.getNombre() != null) {
            tarea.setNombre(validarNombre(dto.getNombre(), dto.getDescripcion() != null ? dto.getDescripcion() : tarea.getDescripcion()));
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
        OrdenMantenimiento orden = ordenRepository.findById(ordenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        if (orden.getEstado() == EstadoOrden.CERRADA) {
            throw new ReglaNegocioException("No se pueden agregar tareas a una orden cerrada");
        }
        if (orden.getEstado() == EstadoOrden.CANCELADA) {
            throw new ReglaNegocioException("No se pueden agregar tareas a una orden cancelada");
        }
        return orden;
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new ReglaNegocioException("El identificador del usuario es obligatorio");
        }
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private Usuario obtenerUsuarioAsignado(Long usuarioId) {
        if (usuarioId != null) {
            return obtenerUsuario(usuarioId);
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ReglaNegocioException("No se pudo identificar el usuario autenticado para asignar la tarea");
        }
        return principal.getUsuario();
    }

    private String validarDescripcion(String descripcion) {
        if (descripcion == null || descripcion.trim().isEmpty()) {
            throw new ReglaNegocioException("La descripción de la tarea es obligatoria");
        }
        return descripcion.trim();
    }

    private String validarNombre(String nombre, String descripcionFallback) {
        String valor = nombre;
        if (valor == null || valor.trim().isEmpty()) {
            valor = descripcionFallback;
        }
        if (valor == null || valor.trim().isEmpty()) {
            throw new ReglaNegocioException("El nombre de la tarea es obligatorio");
        }
        valor = valor.trim();
        return valor.length() > 120 ? valor.substring(0, 120) : valor;
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
                .nombre(tarea.getNombre())
                .estado(tarea.getEstado())
                .descripcion(tarea.getDescripcion())
                .horas(tarea.getHoras())
                .costoManoObra(tarea.getCostoManoObra())
                .label(construirLabelTarea(tarea))
                .ordenCodigo(tarea.getOrden() != null ? tarea.getOrden().getCodigo() : null)
                .ordenTipo(tarea.getOrden() != null ? tarea.getOrden().getTipo() : null)
                .ordenEstado(tarea.getOrden() != null ? tarea.getOrden().getEstado() : null)
                .ordenFechaApertura(tarea.getOrden() != null ? tarea.getOrden().getFechaApertura() : null)
                .ordenKilometraje(tarea.getOrden() != null && tarea.getOrden().getVehiculo() != null ? tarea.getOrden().getVehiculo().getKmActual() : null)
                .vehiculoId(tarea.getOrden() != null && tarea.getOrden().getVehiculo() != null ? tarea.getOrden().getVehiculo().getId() : null)
                .vehiculoPlaca(tarea.getOrden() != null && tarea.getOrden().getVehiculo() != null ? tarea.getOrden().getVehiculo().getPlaca() : null)
                .vehiculoMarca(tarea.getOrden() != null && tarea.getOrden().getVehiculo() != null ? tarea.getOrden().getVehiculo().getMarca() : null)
                .vehiculoModelo(tarea.getOrden() != null && tarea.getOrden().getVehiculo() != null ? tarea.getOrden().getVehiculo().getModelo() : null)
                .planId(tarea.getOrden() != null && tarea.getOrden().getPlan() != null ? tarea.getOrden().getPlan().getId() : null)
                .planNombre(tarea.getOrden() != null && tarea.getOrden().getPlan() != null ? tarea.getOrden().getPlan().getNombre() : null)
                .ordenDetalle(tarea.getOrden() != null ? tarea.getOrden().getDetalle() : null)
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

    private int prioridadOrden(OrdenMantenimiento orden) {
        if (orden == null || orden.getEstado() == EstadoOrden.ABIERTA || orden.getEstado() == EstadoOrden.EN_PROCESO) {
            return 0;
        }
        if (orden.getEstado() == EstadoOrden.CERRADA) {
            return 1;
        }
        return 2;
    }

    private int prioridadTarea(EstadoTarea estado) {
        if (estado == EstadoTarea.PENDIENTE) {
            return 0;
        }
        if (estado == EstadoTarea.NOK) {
            return 1;
        }
        return 2;
    }

    private boolean coincideBusquedaSelector(Tarea tarea, String filtro) {
        OrdenMantenimiento orden = tarea.getOrden();
        String texto = String.join(" ",
                valorBusqueda(tarea.getNombre()),
                valorBusqueda(tarea.getDescripcion()),
                valorBusqueda(tarea.getEstado() != null ? tarea.getEstado().name() : null),
                valorBusqueda(nombreCompleto(tarea.getAsignadoA())),
                valorBusqueda(orden != null ? orden.getCodigo() : null),
                valorBusqueda(orden != null && orden.getTipo() != null ? orden.getTipo().name() : null),
                valorBusqueda(orden != null && orden.getEstado() != null ? orden.getEstado().name() : null),
                valorBusqueda(orden != null ? orden.getDetalle() : null),
                valorBusqueda(orden != null && orden.getPlan() != null ? orden.getPlan().getNombre() : null),
                valorBusqueda(orden != null && orden.getVehiculo() != null ? orden.getVehiculo().getPlaca() : null),
                valorBusqueda(orden != null && orden.getVehiculo() != null ? orden.getVehiculo().getMarca() : null),
                valorBusqueda(orden != null && orden.getVehiculo() != null ? orden.getVehiculo().getModelo() : null));
        return normalizarBusqueda(texto).contains(filtro);
    }

    private String construirLabelTarea(Tarea tarea) {
        OrdenMantenimiento orden = tarea.getOrden();
        StringBuilder label = new StringBuilder("Tarea: ");
        label.append(valorOguion(tarea.getNombre() != null ? tarea.getNombre() : tarea.getDescripcion()));
        if (tarea.getEstado() != null) {
            label.append(" | Estado tarea: ").append(formatearEnum(tarea.getEstado().name()));
        }
        if (orden != null) {
            label.append(" | Orden: ").append(valorOguion(orden.getCodigo()));
            if (orden.getVehiculo() != null) {
                label.append(" | Placa: ").append(valorOguion(orden.getVehiculo().getPlaca()));
                String vehiculo = String.join(" ",
                        valorBusqueda(orden.getVehiculo().getMarca()),
                        valorBusqueda(orden.getVehiculo().getModelo())).trim();
                if (!vehiculo.isBlank()) {
                    label.append(" - ").append(vehiculo);
                }
            }
            if (orden.getTipo() != null) {
                label.append(" | ").append(formatearEnum(orden.getTipo().name()));
            }
            if (orden.getPlan() != null && orden.getPlan().getNombre() != null) {
                label.append(" | Plan: ").append(orden.getPlan().getNombre());
            } else if (orden.getDetalle() != null && !orden.getDetalle().isBlank()) {
                label.append(orden.getTipo() != null && orden.getTipo().name().equals("CORRECTIVA") ? " | Detalle: " : " | Orden detalle: ")
                        .append(orden.getDetalle());
            }
            if (orden.getEstado() != null) {
                label.append(" | Estado orden: ").append(formatearEnum(orden.getEstado().name()));
            }
        }
        String asignado = nombreCompleto(tarea.getAsignadoA());
        if (asignado != null) {
            label.append(" | Asignado: ").append(asignado);
        }
        return label.toString();
    }

    private String normalizarBusqueda(Object valor) {
        return valor == null ? "" : String.valueOf(valor).toLowerCase(LOCALE_ES_EC).trim();
    }

    private String valorBusqueda(Object valor) {
        return valor == null ? "" : String.valueOf(valor);
    }

    private String valorOguion(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private String nombreCompleto(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        String completo = (nombre + " " + apellido).trim();
        return completo.isEmpty() ? null : completo;
    }

    private String formatearEnum(String valor) {
        if (valor == null || valor.isBlank()) {
            return "-";
        }
        if ("PREVENTIVA".equals(valor) || "PREVENTIVO".equals(valor)) {
            return "Preventivo";
        }
        if ("CORRECTIVA".equals(valor) || "CORRECTIVO".equals(valor)) {
            return "Correctivo";
        }
        String normalizado = valor.toLowerCase(LOCALE_ES_EC).replace('_', ' ');
        return normalizado.substring(0, 1).toUpperCase(LOCALE_ES_EC) + normalizado.substring(1);
    }
}
