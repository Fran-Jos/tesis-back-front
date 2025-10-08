package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TareaDTO {
    private Long id;
    private Long ordenId;               // FK (cuando se usa standalone)
    private Long asignadoAId;           // opcional perosna que realiza la tarea
    private String asignadoANombre;
    private EstadoTarea estado;         // PENDIENTE | OK | NOK
    private String descripcion;
    private Double horas;               // opcional
    private BigDecimal costoManoObra;

    // opcional: para alta/actualización en cascada
    private List<RepuestoUsadoDTO> repuestos;
}
