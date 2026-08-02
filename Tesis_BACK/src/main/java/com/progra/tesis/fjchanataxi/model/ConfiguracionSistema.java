package com.progra.tesis.fjchanataxi.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "configuracion_sistema")
public class ConfiguracionSistema {
    @Id
    @Column(name = "cfg_id")
    private Long id;

    @Column(name = "cfg_umbral_km_proxima", nullable = false)
    private Integer umbralKmProxima;
    @Column(name = "cfg_umbral_km_critica", nullable = false)
    private Integer umbralKmCritica;
    @Column(name = "cfg_umbral_dias_proxima", nullable = false)
    private Integer umbralDiasProxima;
    @Column(name = "cfg_umbral_dias_critica", nullable = false)
    private Integer umbralDiasCritica;
    @Column(name = "cfg_evaluacion_automatica", nullable = false)
    private Boolean evaluacionAutomatica;
    @Column(name = "cfg_intervalo_evaluacion_minutos", nullable = false)
    private Integer intervaloEvaluacionMinutos;

    @Column(name = "cfg_modal_habilitado", nullable = false)
    private Boolean modalHabilitado;
    @Column(name = "cfg_notificacion_navegador")
    private Boolean notificacionNavegadorHabilitada;
    @Column(name = "cfg_horizonte_alertas_dias", nullable = false)
    private Integer horizonteAlertasDias;
    @Column(name = "cfg_iva_predeterminado", nullable = false, precision = 5, scale = 2)
    private BigDecimal ivaPredeterminado;
    @Column(name = "cfg_actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cfg_actualizado_por_id")
    private Usuario actualizadoPor;
}
