package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.dashboard.DashboardOrdenDTO;
import com.progra.tesis.fjchanataxi.dto.dashboard.DashboardSummaryDTO;
import com.progra.tesis.fjchanataxi.dto.dashboard.DashboardTareaDTO;
import com.progra.tesis.fjchanataxi.dto.dashboard.DashboardVehiculoDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import com.progra.tesis.fjchanataxi.model.Tarea;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import com.progra.tesis.fjchanataxi.repository.AlertaRepository;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.PlanMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.TareaRepository;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import com.progra.tesis.fjchanataxi.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final VehiculoRepository vehiculoRepository;
    private final PlanMantenimientoRepository planRepository;
    private final OrdenMantenimientoRepository ordenRepository;
    private final AlertaRepository alertaRepository;
    private final TareaRepository tareaRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDTO obtenerResumen() {
        long totalVehiculos = vehiculoRepository.count();
        long planesActivos = planRepository.countByActivoTrue();
        long ordenesAbiertas = ordenRepository.countByEstado(EstadoOrden.ABIERTA)
                + ordenRepository.countByEstado(EstadoOrden.EN_PROCESO);
        long ordenesCerradas = ordenRepository.countByEstado(EstadoOrden.CERRADA);
        long alertasPendientes = alertaRepository.countByEstado(EstadoAlerta.PENDIENTE);
        long tecnicosActivos = usuarioRepository.countByRolAndEstado(Rol.TECNICO, EstadoUsuario.ACTIVO);

        List<DashboardVehiculoDTO> vehiculos = vehiculoRepository.findAll().stream()
                .sorted(Comparator.comparing(Vehiculo::getPlaca, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::mapVehiculo)
                .toList();

        List<DashboardOrdenDTO> ordenes = ordenRepository.findAll().stream()
                .sorted(Comparator.comparing(OrdenMantenimiento::getFechaApertura, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::mapOrden)
                .toList();

        List<DashboardTareaDTO> tareas = tareaRepository.findAll().stream()
                .sorted(Comparator.comparing(Tarea::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::mapTarea)
                .toList();

        return DashboardSummaryDTO.builder()
                .vehiculos(totalVehiculos)
                .planesActivos(planesActivos)
                .ordenesAbiertas(ordenesAbiertas)
                .ordenesCerradas(ordenesCerradas)
                .alertasPendientes(alertasPendientes)
                .tecnicosActivos(tecnicosActivos)
                .vehiculosList(vehiculos)
                .ordenesList(ordenes)
                .tareasList(tareas)
                .build();
    }

    private DashboardVehiculoDTO mapVehiculo(Vehiculo vehiculo) {
        return DashboardVehiculoDTO.builder()
                .id(vehiculo.getId())
                .placa(vehiculo.getPlaca())
                .marca(vehiculo.getMarca())
                .modelo(vehiculo.getModelo())
                .anio(vehiculo.getAnio())
                .estado(vehiculo.getEstado())
                .kmActual(vehiculo.getKmActual())
                .build();
    }

    private DashboardOrdenDTO mapOrden(OrdenMantenimiento orden) {
        var vehiculo = orden.getVehiculo();
        return DashboardOrdenDTO.builder()
                .id(orden.getId())
                .codigo(orden.getCodigo())
                .estado(orden.getEstado())
                .tipo(orden.getTipo())
                .fechaApertura(orden.getFechaApertura())
                .fechaCierre(orden.getFechaCierre())
                .vehiculoId(vehiculo != null ? vehiculo.getId() : null)
                .vehiculoPlaca(vehiculo != null ? vehiculo.getPlaca() : null)
                .build();
    }

    private DashboardTareaDTO mapTarea(Tarea tarea) {
        return DashboardTareaDTO.builder()
                .id(tarea.getId())
                .nombre(tarea.getNombre())
                .estado(tarea.getEstado())
                .asignadoANombre(nombreCompleto(tarea.getAsignadoA()))
                .build();
    }

    private String nombreCompleto(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        String nombres = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellidos = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        String resultado = (nombres + " " + apellidos).trim();
        if (resultado.isEmpty()) {
            return null;
        }
        return resultado.replaceAll("\\s+", " ");
    }
}
