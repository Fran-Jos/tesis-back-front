package com.progra.tesis.fjchanataxi.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanDTO {
    private Long id;
    private Long vehiculoId;     // FK al vehículo
    private String vehiculoPlaca;
    private String nombre;
    private Integer frecuenciaKm;
    private Integer frecuenciaDias;
    private Boolean activo;
    private Integer proximoKm;
    private LocalDate proximaFecha;
}
