package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Representa la ficha técnica consolidada de un vehículo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InformeTecnicoVehiculoDTO {

    private VehiculoResumenDTO vehiculo;
    private EstadisticasVehiculoDTO estadisticas;
    private RegistroKilometrajeResumenDTO ultimoKilometraje;
    private OrdenResumenDTO ultimaOrden;
    private List<OrdenResumenDTO> historialOrdenes;
    private List<PlanResumenDTO> planesActivos;
    private List<AlertaResumenDTO> alertasPendientes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehiculoResumenDTO {
        private Long id;
        private String placa;
        private String marca;
        private String modelo;
        private Integer anio;
        private String chasis;
        private Double capacidadCarga;
        private String color;
        private Long kmActual;
        private EstadoVehiculo estado;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EstadisticasVehiculoDTO {
        private long totalPlanes;
        private long planesActivos;
        private long totalOrdenes;
        private long ordenesAbiertas;
        private long ordenesEnProceso;
        private long ordenesCerradas;
        private long ordenesCanceladas;
        private long totalAlertas;
        private long alertasPendientes;
        private long alertasAtendidas;
        private long alertasCanceladas;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegistroKilometrajeResumenDTO {
        private Long id;
        private LocalDateTime fecha;
        private Long odometro;
        private String registradoPor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrdenResumenDTO {
        private Long id;
        private String codigo;
        private TipoOrden tipo;
        private EstadoOrden estado;
        private LocalDateTime fechaApertura;
        private LocalDateTime fechaCierre;
        private String responsable;
        private BigDecimal total;
        private BigDecimal totalManoObra;
        private BigDecimal totalRepuestos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanResumenDTO {
        private Long id;
        private String nombre;
        private Integer frecuenciaKm;
        private Integer frecuenciaDias;
        private Integer proximoKm;
        private LocalDate proximaFecha;
        private Boolean activo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertaResumenDTO {
        private Long id;
        private TipoAlerta tipo;
        private ClasificacionAlerta clasificacion;
        private EstadoAlerta estado;
        private LocalDate fechaProgramada;
        private String mensaje;
        private String planNombre;
    }
}
