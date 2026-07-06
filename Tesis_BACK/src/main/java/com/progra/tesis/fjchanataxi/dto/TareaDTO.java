package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private String nombre;              // nombre corto de la tarea
    private EstadoTarea estado;         // PENDIENTE | OK | NOK
    private String descripcion;
    private Double horas;               // opcional
    private BigDecimal costoManoObra;
    private String label;
    private String ordenCodigo;
    private TipoOrden ordenTipo;
    private EstadoOrden ordenEstado;
    private LocalDateTime ordenFechaApertura;
    private Long ordenKilometraje;
    private Long vehiculoId;
    private String vehiculoPlaca;
    private String vehiculoMarca;
    private String vehiculoModelo;
    private Long planId;
    private String planNombre;
    private String ordenDetalle;

    // opcional: para alta/actualización en cascada
    private List<RepuestoUsadoDTO> repuestos;
}
