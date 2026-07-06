package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteTareaDetalladaDTO {

    private Long id;
    private EstadoTarea estado;
    private String nombre;
    private String descripcion;
    private String asignadoANombre;
    private Double horas;
    private BigDecimal costoManoObra;
    private BigDecimal totalRepuestos;
    private BigDecimal totalTarea;
    private List<ReporteRepuestoDetalladoDTO> repuestos;
}
