package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.AlertaDTO;

import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.model.*;
import com.progra.tesis.fjchanataxi.repository.*;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/** Lógica de negocio para Alertas. */
@Service @RequiredArgsConstructor
public class AlertaServiceImpl implements AlertaService {

    private final AlertaRepository alertaRepo;
    private final VehiculoRepository vehiculoRepo;
    private final PlanMantenimientoRepository planRepo;
    private final OrdenMantenimientoRepository ordenRepo;

    /** Crea/actualiza manualmente una alerta. */
    @Override
    public AlertaDTO upsert(AlertaDTO dto) {
        Alerta a = (dto.getId() != null)
                ? alertaRepo.findById(dto.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Alerta no encontrada"))
                : new Alerta();

        Vehiculo v = vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        a.setVehiculo(v);

        PlanMantenimiento p = (dto.getPlanId() != null)
                ? planRepo.findById(dto.getPlanId()).orElseThrow(() -> new RecursoNoEncontradoException("Plan no existe"))
                : null;
        if (p != null && !Boolean.TRUE.equals(p.getActivo()) && dto.getEstado() == EstadoAlerta.PENDIENTE) {
            throw new ReglaNegocioException("No se puede crear una alerta pendiente para un plan inactivo");
        }
        a.setPlan(p);

        a.setTipo(dto.getTipo());
        a.setClasificacion(dto.getClasificacion());
        a.setMensaje(dto.getMensaje());
        a.setFechaProgramada(dto.getFechaProgramada());
        a.setEstado(dto.getEstado());

        if (dto.getOrdenAtendidaId() != null) {
            OrdenMantenimiento om = ordenRepo.findById(dto.getOrdenAtendidaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Orden no existe"));
            a.setOrdenAtendida(om);
        } else {
            a.setOrdenAtendida(null);
        }
        return entityToDTO(alertaRepo.save(a));
    }

    /** Cambia el estado de una alerta; opcionalmente la asocia a una orden. */
    @Override
    public AlertaDTO cambiarEstado(Long id, AlertaDTO dto) {
        Alerta a = alertaRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Alerta no encontrada"));
        if (dto.getEstado() != null) {
            a.setEstado(dto.getEstado());
        }
        if (dto.getOrdenAtendidaId() != null) {
            OrdenMantenimiento om = ordenRepo.findById(dto.getOrdenAtendidaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Orden no existe"));
            a.setOrdenAtendida(om);
        }
        return entityToDTO(alertaRepo.save(a));
    }

    /** Elimina una alerta por id. */
    @Override
    public void eliminar(Long id) {
        Alerta a = alertaRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Alerta no encontrada"));
        alertaRepo.delete(a);
    }

    /** Detalle de alerta por id. */
    @Override
    public AlertaDTO obtener(Long id) {
        return alertaRepo.findById(id).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Alerta no encontrada"));
    }

    /** Lista pendientes de un vehículo (ordenadas por fecha). */
    @Override
    public List<AlertaDTO> listarPendientesPorVehiculo(Long vehiculoId) {
        return alertaRepo.findByVehiculoIdAndEstadoOrderByFechaProgramadaAsc(vehiculoId, EstadoAlerta.PENDIENTE)
                .stream().filter(this::alertaActivaPermitida).map(this::entityToDTO).toList();
    }

    // ---- Búsquedas ----
    @Override
    public List<AlertaDTO> listarPorVehiculo(Long vehiculoId) {
        return alertaRepo.findByVehiculoIdOrderByFechaProgramadaAsc(vehiculoId).stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> listarPorPlan(Long planId) {
        return alertaRepo.findByPlanIdOrderByFechaProgramadaAsc(planId).stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> listarPorEstado(com.progra.tesis.fjchanataxi.enums.EstadoAlerta estado) {
        return alertaRepo.findByEstadoOrderByFechaProgramadaAsc(estado).stream()
                .filter(a -> estado != EstadoAlerta.PENDIENTE || alertaActivaPermitida(a))
                .map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> listarPorTipo(com.progra.tesis.fjchanataxi.enums.TipoAlerta tipo) {
        return alertaRepo.findByTipoOrderByFechaProgramadaAsc(tipo).stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> listarPorClasificacion(com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta clasif) {
        return alertaRepo.findByClasificacionOrderByFechaProgramadaAsc(clasif).stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> vencidasHoy() {
        LocalDate hoy = LocalDate.now();
        return alertaRepo.findByEstadoAndFechaProgramadaBeforeOrderByFechaProgramadaAsc(
                        EstadoAlerta.PENDIENTE, hoy)
                .stream().filter(this::alertaActivaPermitida).map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> proximasEnDias(int diasUmbral) {
        LocalDate hoy = LocalDate.now(); LocalDate tope = hoy.plusDays(diasUmbral);
        return alertaRepo.findByEstadoAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(
                        EstadoAlerta.PENDIENTE, hoy, tope)
                .stream().filter(this::alertaActivaPermitida).map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> buscarPorRangoFecha(LocalDate desde, LocalDate hasta, com.progra.tesis.fjchanataxi.enums.EstadoAlerta estado) {
        if (estado != null) {
            return alertaRepo.findByEstadoAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(estado, desde, hasta)
                    .stream()
                    .filter(a -> estado != EstadoAlerta.PENDIENTE || alertaActivaPermitida(a))
                    .map(this::entityToDTO).toList();
        }
        return alertaRepo.findByFechaProgramadaBetweenOrderByFechaProgramadaAsc(desde, hasta)
                .stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<AlertaDTO> buscarPorVehiculoYRango(Long vehiculoId, LocalDate desde, LocalDate hasta, com.progra.tesis.fjchanataxi.enums.EstadoAlerta estado) {
        if (estado != null) {
            return alertaRepo.findByVehiculoIdAndEstadoAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(
                    vehiculoId, estado, desde, hasta).stream()
                    .filter(a -> estado != EstadoAlerta.PENDIENTE || alertaActivaPermitida(a))
                    .map(this::entityToDTO).toList();
        }
        return alertaRepo.findByVehiculoIdAndFechaProgramadaBetweenOrderByFechaProgramadaAsc(
                vehiculoId, desde, hasta).stream().map(this::entityToDTO).toList();
    }

    // ---- mapper ----
    private AlertaDTO entityToDTO(Alerta a) {
        return AlertaDTO.builder()
                .id(a.getId())
                .vehiculoId(a.getVehiculo().getId())
                .vehiculoPlaca(a.getVehiculo().getPlaca())
                .planId(a.getPlan() != null ? a.getPlan().getId() : null)
                .planNombre(a.getPlan() != null ? a.getPlan().getNombre() : null)
                .tipo(a.getTipo())
                .clasificacion(a.getClasificacion())
                .mensaje(a.getMensaje())
                .fechaProgramada(a.getFechaProgramada())
                .estado(a.getEstado())
                .ordenAtendidaId(a.getOrdenAtendida() != null ? a.getOrdenAtendida().getId() : null)
                .build();
    }

    private boolean alertaActivaPermitida(Alerta alerta) {
        return alerta.getPlan() == null || Boolean.TRUE.equals(alerta.getPlan().getActivo());
    }
}
