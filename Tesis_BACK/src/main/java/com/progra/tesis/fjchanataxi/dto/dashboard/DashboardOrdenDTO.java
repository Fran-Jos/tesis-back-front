package com.progra.tesis.fjchanataxi.dto.dashboard;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardOrdenDTO {

    private Long id;
    private String codigo;
    private EstadoOrden estado;
    private TipoOrden tipo;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;
    private Long vehiculoId;
    private String vehiculoPlaca;
}
