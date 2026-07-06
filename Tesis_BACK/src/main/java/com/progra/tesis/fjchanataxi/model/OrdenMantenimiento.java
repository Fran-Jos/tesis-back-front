package com.progra.tesis.fjchanataxi.model;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"vehiculo","plan","creadoPor","responsable","cerradoPor","tareas"})
@Entity
@Table(name = "orden_mantenimiento")
public class OrdenMantenimiento {
    @Id
    @SequenceGenerator(name = "ord_seq", sequenceName = "ord_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ord_seq")
    @EqualsAndHashCode.Include
    @Column(name = "ord_id")
    private Long id;
    @NotBlank
    @Column(name = "ord_codigo", nullable = false, unique = true)
    private String codigo;
    @Enumerated(EnumType.STRING)
    @Column(name = "ord_tipo", nullable = false)
    private TipoOrden tipo;
    @Enumerated(EnumType.STRING)
    @Column(name = "ord_estado", nullable = false)
    private EstadoOrden estado;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ord_vehiculo_id", nullable = false)
    private Vehiculo vehiculo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ord_plan_id")
    private PlanMantenimiento plan;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ord_creado_por_id")
    private Usuario creadoPor;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ord_responsable_id")
    private Usuario responsable;
    @Column(name = "ord_fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "ord_fecha_cierre")
    private LocalDateTime fechaCierre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ord_cerrado_por_id")
    private Usuario cerradoPor;

    @Column(name = "ord_detalle", columnDefinition = "TEXT")
    private String detalle;

    // Totales (persistidos)
    @Builder.Default
    @Column(name = "ord_total_mano_obra", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalManoObra = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "ord_total_repuestos", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalRepuestos = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "ord_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "ord_iva_porc", nullable = false, precision = 5, scale = 2)
    private BigDecimal ivaPorc = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "ord_iva_valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal ivaValor = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "ord_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // Relaciones hijas
    @Builder.Default
    @OneToMany(mappedBy = "orden", fetch = FetchType.LAZY,
            cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Tarea> tareas = new ArrayList<>();
}
