package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.enums.*;
import com.progra.tesis.fjchanataxi.model.*;
import com.progra.tesis.fjchanataxi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MotorAlertasServiceImplTest {
    @Mock PlanMantenimientoRepository planRepository;
    @Mock RegistroKilometrajeRepository kilometrajeRepository;
    @Mock AlertaRepository alertaRepository;
    @Mock ConfiguracionSistemaService configuracionService;
    @InjectMocks MotorAlertasServiceImpl motor;

    private Vehiculo vehiculo;
    private PlanMantenimiento plan;

    @BeforeEach
    void preparar() {
        vehiculo = Vehiculo.builder().id(1L).placa("ABC-1234").kmActual(49_800L).build();
        plan = PlanMantenimiento.builder().id(10L).vehiculo(vehiculo).nombre("Cambio de aceite")
                .activo(true).proximoKm(50_000).proximaFecha(LocalDate.now().plusDays(20)).build();
        ConfiguracionSistema configuracion = ConfiguracionSistema.builder()
                .id(1L).umbralKmProxima(1_500).umbralKmCritica(250)
                .umbralDiasProxima(15).umbralDiasCritica(3).build();
        when(configuracionService.obtenerEntidad()).thenReturn(configuracion);
        when(alertaRepository.save(any(Alerta.class))).thenAnswer(invocation -> {
            Alerta alerta = invocation.getArgument(0);
            alerta.setId(100L);
            return alerta;
        });
    }

    @Test
    void creaAlertaRojaCuandoFaltanMenosKilometrosQueUmbralCritico() {
        when(planRepository.findByVehiculoIdAndActivoTrue(1L)).thenReturn(List.of(plan));
        when(kilometrajeRepository.findFirstByVehiculoIdOrderByFechaDesc(1L)).thenReturn(Optional.empty());
        when(alertaRepository.findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                1L, 10L, TipoAlerta.KILOMETRAJE, EstadoAlerta.PENDIENTE)).thenReturn(Optional.empty());
        when(alertaRepository.findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                1L, 10L, TipoAlerta.FECHA, EstadoAlerta.PENDIENTE)).thenReturn(Optional.empty());

        motor.evaluarVehiculo(1L);

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        Alerta creada = captor.getValue();
        assertEquals(TipoAlerta.KILOMETRAJE, creada.getTipo());
        assertEquals(ClasificacionAlerta.PROXIMA, creada.getClasificacion());
        assertEquals(SeveridadAlerta.ROJO, creada.getSeveridad());
        assertEquals(50_000, creada.getOdometroObjetivo());
    }

    @Test
    void escalaAlertaExistenteSinCrearDuplicado() {
        Alerta existente = Alerta.builder().id(55L).vehiculo(vehiculo).plan(plan)
                .tipo(TipoAlerta.KILOMETRAJE).clasificacion(ClasificacionAlerta.PROXIMA)
                .severidad(SeveridadAlerta.NARANJA).estado(EstadoAlerta.PENDIENTE)
                .fechaProgramada(LocalDate.now()).mensaje("Anterior").build();
        when(planRepository.findById(10L)).thenReturn(Optional.of(plan));
        when(kilometrajeRepository.findFirstByVehiculoIdOrderByFechaDesc(1L)).thenReturn(Optional.empty());
        when(alertaRepository.findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                1L, 10L, TipoAlerta.KILOMETRAJE, EstadoAlerta.PENDIENTE)).thenReturn(Optional.of(existente));
        when(alertaRepository.findFirstByVehiculoIdAndPlanIdAndTipoAndEstadoOrderByFechaProgramadaDesc(
                1L, 10L, TipoAlerta.FECHA, EstadoAlerta.PENDIENTE)).thenReturn(Optional.empty());

        motor.evaluarPlan(10L);

        assertEquals(SeveridadAlerta.ROJO, existente.getSeveridad());
        verify(alertaRepository).save(existente);
    }
}
