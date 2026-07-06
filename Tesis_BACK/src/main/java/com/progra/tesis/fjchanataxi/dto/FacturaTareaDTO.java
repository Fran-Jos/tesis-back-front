package com.progra.tesis.fjchanataxi.dto;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.math.BigDecimal;
import java.util.List;

/** Resumen de una tarea incluida en la factura. */
@Value
@Builder
public class FacturaTareaDTO {
    String descripcion;
    String estado;
    String tecnicoAsignado;
    BigDecimal horas;
    BigDecimal costoManoObra;
    BigDecimal totalRepuestos;
    BigDecimal totalTarea;
    @Singular("repuesto")
    List<FacturaRepuestoDTO> repuestos;
}
