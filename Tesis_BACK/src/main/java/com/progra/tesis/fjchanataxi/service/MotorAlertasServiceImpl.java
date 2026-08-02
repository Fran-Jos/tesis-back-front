package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.enums.*;
import com.progra.tesis.fjchanataxi.model.*;
import com.progra.tesis.fjchanataxi.repository.*;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MotorAlertasServiceImpl implements MotorAlertasService {
    private final PlanMantenimientoRepository planRepository;
    private final RegistroKilometrajeRepository kilometrajeRepository;
    private final AlertaRepository alertaRepository;
    private final ConfiguracionSistemaService configuracionService;

    @Override
    @Transactional
    public void evaluarVehiculo(Long vehiculoId) {
        planRepository.findByVehiculoIdAndActivoTrue(vehiculoId).forEach(this::evaluar);
    }

    @Override
    @Transactional
    public void evaluarPlan(Long planId) {
        evaluar(planRepository.findById(planId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan no encontrado")));
    }

    @Override
    @Transactional
    public int evaluarTodosLosPlanes() {
        List<PlanMantenimiento> planes = planRepository.findByActivoTrue();
        planes.forEach(this::evaluar);
        return planes.size();
    }

    private void evaluar(PlanMantenimiento plan) {
        if (!Boolean.TRUE.equals(plan.getActivo())) {
            cancelarPendientes(plan);
            return;
        }
        ConfiguracionSistema c = configuracionService.obtenerEntidad();
        long kmActual = kilometrajeRepository.findFirstByVehiculoIdOrderByFechaDesc(plan.getVehiculo().getId())
                .map(RegistroKilometraje::getOdometro)
                .orElse(plan.getVehiculo().getKmActual() == null ? 0L : plan.getVehiculo().getKmActual());

        if (plan.getProximoKm() != null) {
            long restantes = plan.getProximoKm() - kmActual;
            Resultado resultado = clasificar(restantes, c.getUmbralKmCritica(), c.getUmbralKmProxima());
            sincronizar(plan, TipoAlerta.KILOMETRAJE, resultado,
                    "Plan " + plan.getNombre() + ": " + describirKm(restantes), plan.getProximaFecha(), plan.getProximoKm());
        }
        if (plan.getProximaFecha() != null) {
            long restantes = ChronoUnit.DAYS.between(LocalDate.now(), plan.getProximaFecha());
            Resultado resultado = clasificar(restantes, c.getUmbralDiasCritica(), c.getUmbralDiasProxima());
            sincronizar(plan, TipoAlerta.FECHA, resultado,
                    "Plan " + plan.getNombre() + ": " + describirDias(restantes), plan.getProximaFecha(), plan.getProximoKm());
        }
    }

    private Resultado clasificar(long restantes, int critico, int proximo) {
        if (restantes <= 0) return new Resultado(ClasificacionAlerta.VENCIDA, SeveridadAlerta.ROJO);
        if (restantes <= critico) return new Resultado(ClasificacionAlerta.PROXIMA, SeveridadAlerta.ROJO);
        if (restantes <= proximo) return new Resultado(ClasificacionAlerta.PROXIMA, SeveridadAlerta.NARANJA);
        return null;
    }

    private void sincronizar(PlanMantenimiento plan, TipoAlerta tipo, Resultado resultado,
                             String mensaje, LocalDate fecha, Integer odometroObjetivo) {
        var existente = alertaRepository
                .findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                        plan.getVehiculo().getId(), plan.getId(), tipo, EstadoAlerta.PENDIENTE);
        if (resultado == null) {
            existente.ifPresent(a -> { a.setEstado(EstadoAlerta.CANCELADA); alertaRepository.save(a); });
            return;
        }

        Alerta alerta = existente.orElseGet(Alerta::new);
        alerta.setVehiculo(plan.getVehiculo());
        alerta.setPlan(plan);
        alerta.setTipo(tipo);
        alerta.setClasificacion(resultado.clasificacion());
        alerta.setSeveridad(resultado.severidad());
        alerta.setMensaje(mensaje);
        alerta.setFechaProgramada(fecha == null ? LocalDate.now() : fecha);
        alerta.setOdometroObjetivo(odometroObjetivo);
        alerta.setEstado(EstadoAlerta.PENDIENTE);
        alertaRepository.save(alerta);
    }

    private void cancelarPendientes(PlanMantenimiento plan) {
        alertaRepository.findByPlanIdAndEstado(plan.getId(), EstadoAlerta.PENDIENTE).forEach(a -> {
            a.setEstado(EstadoAlerta.CANCELADA);
            alertaRepository.save(a);
        });
    }

    private String describirKm(long restantes) {
        if (restantes < 0) return "mantenimiento vencido por " + Math.abs(restantes) + " km";
        if (restantes == 0) return "alcanzó el kilometraje de mantenimiento";
        return "faltan " + restantes + " km para el mantenimiento";
    }

    private String describirDias(long restantes) {
        if (restantes < 0) return "mantenimiento vencido hace " + Math.abs(restantes) + " días";
        if (restantes == 0) return "mantenimiento programado para hoy";
        return "faltan " + restantes + " días para el mantenimiento";
    }

    private record Resultado(ClasificacionAlerta clasificacion, SeveridadAlerta severidad) {}
}
