package com.progra.tesis.fjchanataxi.model;

import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"orden","asignadoA","repuestos"})
@Entity
@Table(name = "tarea")
public class Tarea {
    @Id
    @SequenceGenerator(name = "tar_seq", sequenceName = "tar_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tar_seq")
    @EqualsAndHashCode.Include
    @Column(name = "tar_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tar_orden_id", nullable = false)
    private OrdenMantenimiento orden;
    @Enumerated(EnumType.STRING)
    @Column(name = "tar_estado", nullable = false)
    private EstadoTarea estado;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tar_asignado_a_id")
    private Usuario asignadoA;
    @Column(name = "tar_nombre", length = 120)
    private String nombre;
    @Column(name = "tar_descripcion", nullable = false, length = 200)
    private String descripcion;
    @Column(name = "tar_horas")
    private Double horas;
    @Builder.Default
    @Column(name = "tar_costo_mano_obra", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoManoObra = BigDecimal.ZERO;
    @Builder.Default
    @OneToMany(mappedBy = "tarea", fetch = FetchType.LAZY,
            cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RepuestoUsado> repuestos = new ArrayList<>();
}
