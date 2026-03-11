package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.PlanDTO;
import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.model.Alerta;
import com.progra.tesis.fjchanataxi.model.PlanMantenimiento;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import com.progra.tesis.fjchanataxi.repository.AlertaRepository;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.PlanMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.VehiculoRepository;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

/** Lógica de negocio para Planes de Mantenimiento. */
@Service @RequiredArgsConstructor
public class PlanMantenimientoServiceImpl implements PlanMantenimientoService {

    private static final int UMBRAL_PROXIMA_FECHA = 5;

    private final PlanMantenimientoRepository planRepo;
    private final VehiculoRepository vehiculoRepo;
    private final AlertaRepository alertaRepo;
    private final OrdenMantenimientoRepository ordenRepo;

    /** Crea un plan para un vehículo. */
    @Override
    public PlanDTO crear(PlanDTO dto) {
        if (dto.getVehiculoId() == null) {
            throw new ReglaNegocioException("El vehículo es obligatorio");
        }
        Vehiculo v = vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        PlanMantenimiento p = dtoToEntity(dto, new PlanMantenimiento(), v);
        PlanMantenimiento guardado = planRepo.save(p);
        sincronizarAlertaFecha(guardado);
        return entityToDTO(guardado);
    }

    /** Actualiza parcialmente un plan (permite cambiar de vehículo). */
    @Override
    public PlanDTO actualizar(Long id, PlanDTO dto) {
        PlanMantenimiento p = planRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan no encontrado"));
        Vehiculo v = (dto.getVehiculoId() != null)
                ? vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"))
                : p.getVehiculo();
        p = dtoToEntity(dto, p, v);
        PlanMantenimiento actualizado = planRepo.save(p);
        sincronizarAlertaFecha(actualizado);
        return entityToDTO(actualizado);
    }

    /** Elimina un plan por id. */
    @Override
    public void eliminar(Long id) {
        PlanMantenimiento p = planRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan no encontrado"));
        List<String> bloqueos = new ArrayList<>();
        long ordenesTotales = ordenRepo.countByPlanId(id);
        if (ordenesTotales > 0) {
            long ordenesActivas = ordenRepo.countByPlanIdAndEstadoIn(id, EnumSet.of(EstadoOrden.ABIERTA, EstadoOrden.EN_PROCESO));
            String detalleActivas = ordenesActivas > 0
                    ? String.format(", con %d %s en curso",
                    ordenesActivas,
                    ordenesActivas == 1 ? "orden" : "órdenes")
                    : "";
            bloqueos.add(String.format("está asociado a %d %s%s. Cierre, reasigne o elimine esas órdenes",
                    ordenesTotales,
                    ordenesTotales == 1 ? "orden de mantenimiento" : "órdenes de mantenimiento",
                    detalleActivas));
        }
        long alertasPendientes = alertaRepo.countByPlanIdAndEstado(id, EstadoAlerta.PENDIENTE);
        if (alertasPendientes > 0) {
            bloqueos.add(String.format("posee %d %s pendientes. Actualice o elimine esas alertas",
                    alertasPendientes,
                    alertasPendientes == 1 ? "alerta" : "alertas"));
        }

        long alertasTotales = alertaRepo.countByPlanId(id);
        if (alertasTotales > alertasPendientes) {
            long historicas = alertasTotales - alertasPendientes;
            bloqueos.add(String.format("mantiene %d %s históricas asociadas. Limpie el historial de alertas",
                    historicas,
                    historicas == 1 ? "alerta" : "alertas"));
        }
        if (!bloqueos.isEmpty()) {
            String detalle = String.join(". ", bloqueos);
            throw new ReglaNegocioException(String.format(
                    "No se puede eliminar el plan %s porque %s.",
                    p.getNombre(), detalle));
        }
        planRepo.delete(p);
    }

    /** Obtiene detalle del plan por id. */
    @Override
    public PlanDTO obtener(Long id) {
        return planRepo.findById(id).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan no encontrado"));
    }

    /** Lista planes activos por vehículo. */
    @Override
    public List<PlanDTO> listarActivosPorVehiculo(Long vehiculoId) {
        return planRepo.findByVehiculoIdAndActivoTrue(vehiculoId).stream()
                .peek(this::sincronizarAlertaFecha)
                .map(this::entityToDTO)
                .toList();
    }

    // ---- Búsquedas / soporte a alertas ----
    @Override
    public List<PlanDTO> listarPorVehiculo(Long vehiculoId) {
        return planRepo.findByVehiculoId(vehiculoId).stream()
                .peek(this::sincronizarAlertaFecha)
                .map(this::entityToDTO)
                .toList();
    }

    @Override
    public List<PlanDTO> listarActivos() {
        return planRepo.findByActivoTrue().stream()
                .peek(this::sincronizarAlertaFecha)
                .map(this::entityToDTO)
                .toList();
    }

    @Override
    public List<PlanDTO> buscarPorNombreLike(String nombre) {
        String n = nombre == null ? "" : nombre.trim();
        return planRepo.findByNombreContainingIgnoreCase(n).stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<PlanDTO> proximosPorKm(Long vehiculoId, int umbralKm) {
        Vehiculo v = vehiculoRepo.findById(vehiculoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        long km = v.getKmActual() == null ? 0 : v.getKmActual();
        return planRepo.findByVehiculoIdAndActivoTrue(vehiculoId).stream()
                .peek(this::sincronizarAlertaFecha)
                .filter(p -> p.getProximoKm() != null)
                .filter(p -> {
                    int faltan = p.getProximoKm() - (int) km;
                    return faltan > 0 && faltan <= umbralKm;
                })
                .map(this::entityToDTO).toList();
    }

    @Override
    public List<PlanDTO> vencidosPorKm(Long vehiculoId) {
        Vehiculo v = vehiculoRepo.findById(vehiculoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        long km = v.getKmActual() == null ? 0 : v.getKmActual();
        return planRepo.findByVehiculoIdAndActivoTrue(vehiculoId).stream()
                .peek(this::sincronizarAlertaFecha)
                .filter(p -> p.getProximoKm() != null && p.getProximoKm() <= km)
                .map(this::entityToDTO).toList();
    }

    @Override
    public List<PlanDTO> proximosPorFecha(Long vehiculoId, int umbralDias) {
        LocalDate hoy = LocalDate.now(); LocalDate tope = hoy.plusDays(umbralDias);
        return planRepo.findByVehiculoIdAndActivoTrue(vehiculoId).stream()
                .filter(p -> p.getProximaFecha() != null)
                .filter(p -> !p.getProximaFecha().isBefore(hoy) && !p.getProximaFecha().isAfter(tope))
                .map(this::entityToDTO).toList();
    }

    @Override
    public List<PlanDTO> vencidosPorFecha(Long vehiculoId) {
        LocalDate hoy = LocalDate.now();
        return planRepo.findByVehiculoIdAndActivoTrue(vehiculoId).stream()
                .filter(p -> p.getProximaFecha() != null && p.getProximaFecha().isBefore(hoy))
                .map(this::entityToDTO).toList();
    }

    // ---- mappers ----
    private PlanMantenimiento dtoToEntity(PlanDTO dto, PlanMantenimiento e, Vehiculo v) {
        e.setVehiculo(v);
        if (dto.getNombre() != null) e.setNombre(dto.getNombre());
        if (dto.getFrecuenciaKm() != null) e.setFrecuenciaKm(dto.getFrecuenciaKm());
        if (dto.getFrecuenciaDias() != null) e.setFrecuenciaDias(dto.getFrecuenciaDias());
        if (dto.getActivo() != null) {
            e.setActivo(dto.getActivo());
        } else if (e.getActivo() == null) {
            e.setActivo(Boolean.TRUE);
        }
        if (dto.getProximoKm() != null) e.setProximoKm(dto.getProximoKm());
        if (dto.getProximaFecha() != null) e.setProximaFecha(dto.getProximaFecha());
        return e;
    }

    private PlanDTO entityToDTO(PlanMantenimiento e) {
        return PlanDTO.builder()
                .id(e.getId())
                .vehiculoId(e.getVehiculo().getId())
                .vehiculoPlaca(e.getVehiculo().getPlaca())
                .nombre(e.getNombre())
                .frecuenciaKm(e.getFrecuenciaKm())
                .frecuenciaDias(e.getFrecuenciaDias())
                .activo(e.getActivo())
                .proximoKm(e.getProximoKm())
                .proximaFecha(e.getProximaFecha())
                .build();
    }
    private void sincronizarAlertaFecha(PlanMantenimiento plan) {
        if (plan.getId() == null) {
            return;
        }
        LocalDate proxima = plan.getProximaFecha();
        List<Alerta> pendientes = alertaRepo.findByPlanIdOrderByFechaProgramadaAsc(plan.getId()).stream()
                .filter(a -> a.getEstado() == EstadoAlerta.PENDIENTE)
                .filter(a -> a.getTipo() == TipoAlerta.FECHA || a.getTipo() == TipoAlerta.CORRECTIVO)
                .toList();

        if (proxima == null) {
            pendientes.forEach(alertaRepo::delete);
            return;
        }

        LocalDate hoy = LocalDate.now();
        TipoAlerta tipo;
        ClasificacionAlerta clasif;
        String mensaje;

        if (proxima.isBefore(hoy)) {
            tipo = TipoAlerta.CORRECTIVO;
            clasif = ClasificacionAlerta.VENCIDA;
            mensaje = "Plan " + plan.getNombre() + " vencido por fecha. Atención correctiva urgente.";
        } else {
            long diasRestantes = ChronoUnit.DAYS.between(hoy, proxima);
            tipo = TipoAlerta.FECHA;
            clasif = ClasificacionAlerta.PROXIMA;
            if (diasRestantes <= UMBRAL_PROXIMA_FECHA) {
                mensaje = "Plan " + plan.getNombre() + " próximo a vencer el " + proxima + ".";
            } else {
                mensaje = "Plan " + plan.getNombre() + " programado para el " + proxima + ".";
            }
        }

        Alerta alerta = pendientes.isEmpty() ? new Alerta() : pendientes.get(0);
        alerta.setVehiculo(plan.getVehiculo());
        alerta.setPlan(plan);
        alerta.setTipo(tipo);
        alerta.setClasificacion(clasif);
        alerta.setMensaje(mensaje);
        alerta.setFechaProgramada(proxima);
        alerta.setEstado(EstadoAlerta.PENDIENTE);
        alertaRepo.save(alerta);

        if (pendientes.size() > 1) {
            pendientes.subList(1, pendientes.size()).forEach(alertaRepo::delete);
        }
    }
}
