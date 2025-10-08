package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteMantenimientoDetalladoDTO {

    private Long ordenId;
    private String codigo;
    private TipoOrden tipo;
    private EstadoOrden estado;
    private String vehiculoPlaca;
    private String vehiculoDescripcion;
    private String planNombre;
    private String responsableNombre;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;
    private BigDecimal totalManoObra;
    private BigDecimal totalRepuestos;
    private BigDecimal subtotal;
    private BigDecimal ivaValor;
    private BigDecimal total;
    private List<ReporteTareaDetalladaDTO> tareas;
}
