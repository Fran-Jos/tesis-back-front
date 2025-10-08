package com.progra.tesis.fjchanataxi.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepuestoUsadoDTO {
    private Long id;
    private Long tareaId;               // FK (cuando se usa standalone)
    private String descripcion;
    private BigDecimal cantidad;
    private BigDecimal costoUnitario;
}
