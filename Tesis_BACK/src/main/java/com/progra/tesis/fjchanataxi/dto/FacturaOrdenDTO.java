package com.progra.tesis.fjchanataxi.dto;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Detalle de factura generado para una orden de mantenimiento atendida. */
@Value
@Builder
public class FacturaOrdenDTO {
    Long ordenId;
    String codigo;
    LocalDateTime fechaApertura;
    LocalDateTime fechaCierre;
    String vehiculoPlaca;
    String vehiculoDescripcion;
    String responsableNombre;
    BigDecimal totalManoObra;
    BigDecimal totalRepuestos;
    BigDecimal subtotal;
    BigDecimal ivaPorc;
    BigDecimal ivaValor;
    BigDecimal total;
    @Singular("tarea")
    List<FacturaTareaDTO> tareas;
}
