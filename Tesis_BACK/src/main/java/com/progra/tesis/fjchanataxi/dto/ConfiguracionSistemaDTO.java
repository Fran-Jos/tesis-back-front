package com.progra.tesis.fjchanataxi.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionSistemaDTO {
    private Integer umbralKmProxima;
    private Integer umbralKmCritica;
    private Integer umbralDiasProxima;
    private Integer umbralDiasCritica;
    private Boolean evaluacionAutomatica;
    private Integer intervaloEvaluacionMinutos;
    private Boolean modalHabilitado;
    private Boolean notificacionNavegadorHabilitada;
    private Integer horizonteAlertasDias;
    private BigDecimal ivaPredeterminado;
    private LocalDateTime actualizadoEn;
    private String actualizadoPor;
}
