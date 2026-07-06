package com.progra.tesis.fjchanataxi.model;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"registrosKilometraje","planesMantenimiento","alertas","ordenesMantenimiento"})
@Entity
@Table(name = "vehiculo")
public class Vehiculo {

    @Id
    @SequenceGenerator(name = "vehi_seq", sequenceName = "vehi_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "vehi_seq")
    @EqualsAndHashCode.Include
    @Column(name = "vehi_id")
    private Long id;
    @NotBlank
    @Column(name = "vehi_placa", nullable = false, unique = true, length = 20)
    private String placa;
    @Column(name = "vehi_marca")
    private String marca;
    @Column(name = "vehi_modelo")
    private String modelo;
    @Column(name = "vehi_anio")
    private Integer anio;
    @Column(name = "vehi_chasis")
    private String chasis;
    @Column(name = "vehi_capacidad_carga")
    private Double capacidadCarga;
    @Column(name = "vehi_color")
    private String color;
    @Column(name = "vehi_km_actual")
    private Long kmActual;
    @Enumerated(EnumType.STRING)
    @Column(name = "vehi_estado", nullable = false)
    private EstadoVehiculo estado;

    // Relaciones
    @Builder.Default
    @OneToMany(mappedBy = "vehiculo", fetch = FetchType.LAZY)
    private List<RegistroKilometraje> registrosKilometraje = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "vehiculo", fetch = FetchType.LAZY)
    private List<PlanMantenimiento> planesMantenimiento = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "vehiculo", fetch = FetchType.LAZY)
    private List<Alerta> alertas = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "vehiculo", fetch = FetchType.LAZY)
    private List<OrdenMantenimiento> ordenesMantenimiento = new ArrayList<>();
}
