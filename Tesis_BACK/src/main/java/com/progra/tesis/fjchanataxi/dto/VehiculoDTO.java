package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehiculoDTO {
    private Long id;
    private String placa;
    private String marca;
    private String modelo;
    private Integer anio;
    private String chasis;
    private Double capacidadCarga;
    private String color;
    private Long kmActual;
    private EstadoVehiculo estado;    // ACTIVO | INACTIVO
}
