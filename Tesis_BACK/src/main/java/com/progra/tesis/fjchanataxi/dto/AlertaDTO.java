package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import lombok.*;

import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaDTO {

    /** Opcional (para updates); normalmente el ID viene en la ruta. */
    private Long id;

    /** FK al vehículo (obligatoria a nivel de negocio). */
    private Long vehiculoId;
    private String vehiculoPlaca;

    /** FK al plan (opcional: solo si es preventiva por plan). */
    private Long planId;
    private String planNombre;

    /** Tipo de alerta: KILOMETRAJE, FECHA o CORRECTIVO. */
    private TipoAlerta tipo;

    /** Clasificación técnica: PROXIMA o VENCIDA (para preventivas). */
    private ClasificacionAlerta clasificacion;

    /** Mensaje descriptivo de la alerta. */
    private String mensaje;

    /** Fecha objetivo para atender la alerta. */
    private LocalDate fechaProgramada;

    /** Estado de la alerta: PENDIENTE, ATENDIDA, CANCELADA. */
    private EstadoAlerta estado;

    /** Usuario que creó la alerta (opcional si la genera el sistema). */
    private Long creadaPorId;

    /** Orden que atendió la alerta (se completa al cerrar la OM). */
    private Long ordenAtendidaId;
}
