package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenDTO {

    private Long id;
    private String codigo;              // ej. "OM-2025-0042"
    private TipoOrden tipo;             // PREVENTIVO | CORRECTIVO
    private EstadoOrden estado;         // ABIERTA | EN_PROCESO | CERRADA | CANCELADA
    private Long vehiculoId;            // FK obligatorio a Vehiculo
    private String vehiculoPlaca;
    private Long planId;                // FK opcional a PlanMantenimiento (si es preventiva)
    private String planNombre;
    private Long creadoPorId;           // FK opcional a Usuario (quién abrió)
    private String creadoPorNombre;
    private Long responsableId;         // FK opcional a Usuario (técnico responsable)
    private String responsableNombre;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;  // null mientras esté abierta
    private Long cerradoPorId;
    private String cerradoPorNombre;
    private String detalle;
    private Long kilometraje;
    private String label;
    private BigDecimal totalManoObra;   // Σ costo_mano_obra de tareas
    private BigDecimal totalRepuestos;  // Σ (cantidad * costo_unitario) de repuestos
    private BigDecimal subtotal;        // mano_obra + repuestos
    private BigDecimal ivaPorc;         // p.ej., 12.00
    private BigDecimal ivaValor;        // subtotal * (ivaPorc/100)
    private BigDecimal total;           // subtotal + ivaValor

    // Detalle (opcional) para crear/actualizar en cascada
    private List<TareaDTO> tareas;

    // Campo de apoyo para reportes/resúmenes
    private Integer cantidad;
}
