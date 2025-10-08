package com.progra.tesis.fjchanataxi.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "repuesto_usado")
public class RepuestoUsado {

    @Id
    @SequenceGenerator(name = "rep_seq", sequenceName = "rep_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "rep_seq")
    @EqualsAndHashCode.Include
    @Column(name = "rep_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rep_tarea_id", nullable = false)
    private Tarea tarea;

    @Column(name = "rep_descripcion", nullable = false, length = 200)
    private String descripcion;

    @Column(name = "rep_cantidad", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "rep_costo_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitario;
}
