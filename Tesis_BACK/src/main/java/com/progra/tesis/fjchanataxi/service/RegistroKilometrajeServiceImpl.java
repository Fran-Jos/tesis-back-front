package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RegistroKilometrajeDTO;
import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.model.Alerta;
import com.progra.tesis.fjchanataxi.model.PlanMantenimiento;
import com.progra.tesis.fjchanataxi.model.RegistroKilometraje;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import com.progra.tesis.fjchanataxi.repository.AlertaRepository;
import com.progra.tesis.fjchanataxi.repository.PlanMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RegistroKilometrajeRepository;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import com.progra.tesis.fjchanataxi.repository.VehiculoRepository;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Lógica de negocio para Registro de Kilometraje. */
@Service
@RequiredArgsConstructor
public class RegistroKilometrajeServiceImpl implements RegistroKilometrajeService {

    private static final int UMBRAL_PROXIMA_KM = 1500;

    private final RegistroKilometrajeRepository regRepo;
    private final VehiculoRepository vehiculoRepo;
    private final UsuarioRepository usuarioRepo;
    private final PlanMantenimientoRepository planRepo;
    private final AlertaRepository alertaRepo;

    /**
     * Inserta un registro de km, valida que el odómetro sea estrictamente mayor al último valor,
     * actualiza km del vehículo y genera/actualiza alertas por KM.
     */
    @Override
    public RegistroKilometrajeDTO crear(RegistroKilometrajeDTO dto) {
        if (dto.getVehiculoId() == null) {
            throw new ReglaNegocioException("El vehículo es obligatorio");
        }
        if (dto.getOdometro() == null) {
            throw new ReglaNegocioException("El odómetro es obligatorio");
        }

        Vehiculo vehiculo = vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        Usuario usuario = (dto.getUsuarioId() != null)
                ? usuarioRepo.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no existe"))
                : null;

        // Validación clave: el nuevo odómetro debe ser > al último valor conocido
        long ultimoKm = obtenerUltimoKmReferencia(vehiculo.getId(), vehiculo.getKmActual());
        if (dto.getOdometro() <= ultimoKm) {
            throw new ReglaNegocioException(
                    "El odómetro (" + dto.getOdometro() + ") debe ser mayor al último valor registrado (" + ultimoKm + ")."
            );
        }

        // Persistir registro
        RegistroKilometraje reg = new RegistroKilometraje();
        reg.setVehiculo(vehiculo);
        reg.setUsuario(usuario);
        reg.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDateTime.now());
        reg.setOdometro(dto.getOdometro());
        reg = regRepo.save(reg);

        // Actualiza odómetro del vehículo (ahora sabemos que es mayor)
        vehiculo.setKmActual(dto.getOdometro());
        vehiculoRepo.save(vehiculo);

        // Reglas de alertas por KM (próxima / vencida contra proximoKm del plan)
        List<PlanMantenimiento> planes = planRepo.findByVehiculoIdAndActivoTrue(vehiculo.getId());
        for (PlanMantenimiento plan : planes) {
            if (plan.getProximoKm() == null) continue;
            int faltan = plan.getProximoKm() - dto.getOdometro().intValue();
            if (faltan <= 0) {
                upsertAlertaKm(vehiculo, plan, ClasificacionAlerta.VENCIDA);
            } else if (faltan <= UMBRAL_PROXIMA_KM) {
                upsertAlertaKm(vehiculo, plan, ClasificacionAlerta.PROXIMA);
            }
        }

        return toDTO(reg);
    }

    /** Lista registros de un vehículo (desc por fecha). */
    @Override
    public List<RegistroKilometrajeDTO> listarPorVehiculo(Long vehiculoId) {
        return regRepo.findByVehiculoIdOrderByFechaDesc(vehiculoId)
                .stream().map(this::toDTO).toList();
    }

    /** Lista registros hechos por un usuario (desc por fecha). */
    @Override
    public List<RegistroKilometrajeDTO> listarPorUsuario(Long usuarioId) {
        return regRepo.findByUsuarioIdOrderByFechaDesc(usuarioId)
                .stream().map(this::toDTO).toList();
    }

    /** Lista registros por rango de fechas para un vehículo (desc por fecha). */
    @Override
    public List<RegistroKilometrajeDTO> listarPorRangoFecha(Long vehiculoId, LocalDateTime desde, LocalDateTime hasta) {
        return regRepo.findByVehiculoIdAndFechaBetweenOrderByFechaDesc(vehiculoId, desde, hasta)
                .stream().map(this::toDTO).toList();
    }

    /** Retorna el último registro de un vehículo. */
    @Override
    public RegistroKilometrajeDTO ultimoDeVehiculo(Long vehiculoId) {
        return regRepo.findFirstByVehiculoIdOrderByFechaDesc(vehiculoId)
                .map(this::toDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("El vehículo no tiene registros de km"));
    }

    // ------------------- Helpers de Alertas -------------------

    private void upsertAlertaKm(Vehiculo vehiculo, PlanMantenimiento plan, ClasificacionAlerta clasif) {
        var existentes = alertaRepo.findByVehiculoIdAndPlanIdAndTipoAndClasificacionAndEstado(
                vehiculo.getId(), plan.getId(), TipoAlerta.KILOMETRAJE, clasif, EstadoAlerta.PENDIENTE);

        if (!existentes.isEmpty()) {
            // Ya existe una alerta pendiente de la misma clasificación; refrescamos mensaje y fecha
            Alerta alerta = existentes.get(0);
            alerta.setMensaje(buildMensaje(plan, clasif));
            alerta.setFechaProgramada(LocalDate.now());
            alertaRepo.save(alerta);
            return;
        }

        if (clasif == ClasificacionAlerta.VENCIDA) {
            // Si hay una "próxima" pendiente, la convertimos a "vencida"
            var previa = alertaRepo.findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                    vehiculo.getId(), plan.getId(), TipoAlerta.KILOMETRAJE, EstadoAlerta.PENDIENTE);
            if (previa.isPresent()) {
                Alerta alerta = previa.get();
                alerta.setClasificacion(ClasificacionAlerta.VENCIDA);
                alerta.setMensaje(buildMensaje(plan, clasif));
                alerta.setFechaProgramada(LocalDate.now());
                alertaRepo.save(alerta);
                return;
            }
        }

        // Crear nueva alerta
        Alerta nueva = Alerta.builder()
                .vehiculo(vehiculo)
                .plan(plan)
                .tipo(TipoAlerta.KILOMETRAJE)
                .clasificacion(clasif)
                .mensaje(buildMensaje(plan, clasif))
                .fechaProgramada(LocalDate.now())
                .estado(EstadoAlerta.PENDIENTE)
                .build();
        alertaRepo.save(nueva);
    }

    private String buildMensaje(PlanMantenimiento plan, ClasificacionAlerta clasif) {
        return "Plan " + plan.getNombre() +
                (clasif == ClasificacionAlerta.VENCIDA ? " vencido" : " próximo") +
                " por kilometraje";
    }

    // ------------------- Mappers -------------------

    private RegistroKilometrajeDTO toDTO(RegistroKilometraje e) {
        return RegistroKilometrajeDTO.builder()
                .id(e.getId())
                .vehiculoId(e.getVehiculo().getId())
                .vehiculoPlaca(e.getVehiculo().getPlaca())
                .usuarioId(e.getUsuario() != null ? e.getUsuario().getId() : null)
                .usuarioNombre(e.getUsuario() != null ? e.getUsuario().getNombre() + " " + e.getUsuario().getApellido() : null)
                .fecha(e.getFecha())
                .odometro(e.getOdometro())
                .build();
    }

    /**
     * Obtiene el último km de referencia del vehículo: el máximo entre
     * - kmActual del vehículo (si existe), y
     * - el odómetro del último registro guardado (si existe).
     */
    private long obtenerUltimoKmReferencia(Long vehiculoId, Long kmActualVehiculo) {
        long kmVehiculo = kmActualVehiculo != null ? kmActualVehiculo : 0L;
        return regRepo.findFirstByVehiculoIdOrderByFechaDesc(vehiculoId)
                .map(r -> Math.max(kmVehiculo, r.getOdometro()))
                .orElse(kmVehiculo);
    }
}
