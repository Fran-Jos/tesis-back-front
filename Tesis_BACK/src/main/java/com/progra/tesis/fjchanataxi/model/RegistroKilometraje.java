package com.progra.tesis.fjchanataxi.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(
        name = "registro_kilometraje",
        uniqueConstraints = @UniqueConstraint(columnNames = {"reg_vehiculo_id","reg_fecha"})
)
public class RegistroKilometraje {
    @Id
    @SequenceGenerator(name = "reg_km_seq", sequenceName = "reg_km_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reg_km_seq")
    @EqualsAndHashCode.Include
    @Column(name = "reg_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reg_vehiculo_id", nullable = false)
    private Vehiculo vehiculo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reg_usuario_id")
    private Usuario usuario;
    @Column(name = "reg_fecha", nullable = false)
    private LocalDateTime fecha;
    @Column(name = "reg_odometro", nullable = false)
    private Long odometro;
}
