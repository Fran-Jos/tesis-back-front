package com.progra.tesis.fjchanataxi.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {

    private long vehiculos;
    private long planesActivos;
    private long ordenesAbiertas;
    private long ordenesCerradas;
    private long alertasPendientes;
    private long tecnicosActivos;
    private List<DashboardVehiculoDTO> vehiculosList;
    private List<DashboardOrdenDTO> ordenesList;
    private List<DashboardTareaDTO> tareasList;
}
