package com.progra.tesis.fjchanataxi.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

/** Item de repuesto usado dentro de la factura de una orden. */
@Value
@Builder
public class FacturaRepuestoDTO {
    String descripcion;
    BigDecimal cantidad;
    BigDecimal costoUnitario;
    BigDecimal costoTotal;
}
