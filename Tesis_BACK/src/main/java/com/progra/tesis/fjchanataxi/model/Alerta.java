package com.progra.tesis.fjchanataxi.model;

import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "alerta")
public class Alerta {
    @Id
    @SequenceGenerator(name = "ale_seq", sequenceName = "ale_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ale_seq")
    @EqualsAndHashCode.Include
    @Column(name = "ale_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ale_vehiculo_id", nullable = false)
    private Vehiculo vehiculo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ale_plan_id")
    private PlanMantenimiento plan;
    @Enumerated(EnumType.STRING)
    @Column(name = "ale_tipo", nullable = false)
    private TipoAlerta tipo;
    @Enumerated(EnumType.STRING)
    @Column(name = "ale_clasificacion", nullable = false)
    private ClasificacionAlerta clasificacion; // PROXIMA o VENCIDA
    @Column(name = "ale_mensaje", nullable = false, length = 200)
    private String mensaje;
    @Column(name = "ale_fecha_programada", nullable = false)
    private LocalDate fechaProgramada;
    @Enumerated(EnumType.STRING)
    @Column(name = "ale_estado", nullable = false)
    private EstadoAlerta estado;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ale_creada_por_id")
    private Usuario creadaPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ale_orden_atendida_id")
    private OrdenMantenimiento ordenAtendida;
}
