package com.progra.tesis.fjchanataxi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"alertas","ordenesGeneradas","vehiculo"})
@Entity
@Table(name = "plan_mantenimiento")
public class PlanMantenimiento {

    @Id
    @SequenceGenerator(name = "plan_seq", sequenceName = "plan_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "plan_seq")
    @EqualsAndHashCode.Include
    @Column(name = "pla_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pla_vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @NotBlank
    @Column(name = "pla_nombre", nullable = false)
    private String nombre;

    @Column(name = "pla_frecuencia_km")
    private Integer frecuenciaKm;

    @Column(name = "pla_frecuencia_dias")
    private Integer frecuenciaDias;

    @Column(name = "pla_activo", nullable = false)
    private Boolean activo;

    @Column(name = "pla_proximo_km")
    private Integer proximoKm;

    @Column(name = "pla_proxima_fecha")
    private LocalDate proximaFecha;

    // Relaciones
    @Builder.Default
    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
    private List<Alerta> alertas = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
    private List<OrdenMantenimiento> ordenesGeneradas = new ArrayList<>();
}
