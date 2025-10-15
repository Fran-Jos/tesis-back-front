package com.progra.tesis.fjchanataxi.dto.dashboard;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardVehiculoDTO {

    private Long id;
    private String placa;
    private String marca;
    private String modelo;
    private Integer anio;
    private EstadoVehiculo estado;
    private Long kmActual;
}
