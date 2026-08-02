package com.progra.tesis.fjchanataxi.config;

import com.progra.tesis.fjchanataxi.model.ConfiguracionSistema;
import com.progra.tesis.fjchanataxi.service.ConfiguracionSistemaService;
import com.progra.tesis.fjchanataxi.service.MotorAlertasService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class MotorAlertasScheduler {
    private final MotorAlertasService motor;
    private final ConfiguracionSistemaService configuracionService;
    private LocalDateTime ultimaEjecucion;

    @Scheduled(fixedDelay = 60000)
    public void evaluar() {
        ConfiguracionSistema c = configuracionService.obtenerEntidad();
        if (!Boolean.TRUE.equals(c.getEvaluacionAutomatica())) return;
        if (ultimaEjecucion != null && Duration.between(ultimaEjecucion, LocalDateTime.now()).toMinutes()
                < c.getIntervaloEvaluacionMinutos()) return;
        motor.evaluarTodosLosPlanes();
        ultimaEjecucion = LocalDateTime.now();
    }
}
