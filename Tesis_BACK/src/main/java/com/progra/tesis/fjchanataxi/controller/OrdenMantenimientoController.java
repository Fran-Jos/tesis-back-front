package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.FacturaOrdenDTO;
import com.progra.tesis.fjchanataxi.dto.OrdenDTO;
import com.progra.tesis.fjchanataxi.dto.ReporteMantenimientoDetalladoDTO;
import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;
import com.progra.tesis.fjchanataxi.dto.TareaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import com.progra.tesis.fjchanataxi.service.OrdenMantenimientoService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(value = "/ordenes", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class OrdenMantenimientoController {

    private final OrdenMantenimientoService ordenService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<OrdenDTO> crear(@RequestBody OrdenDTO dto) {
        OrdenDTO creada = ordenService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listar() {
        return ResponseEntity.ok(ordenService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<OrdenDTO> obtener(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(ordenService.obtener(id));
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<OrdenDTO> actualizar(@PathVariable @Min(1) Long id, @RequestBody OrdenDTO dto) {
        return ResponseEntity.ok(ordenService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        ordenService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{id}/tareas", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<TareaDTO> agregarTarea(@PathVariable @Min(1) Long id, @RequestBody TareaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.agregarTarea(id, dto));
    }

    @PostMapping(path = "/tareas/{tareaId}/repuestos", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<RepuestoUsadoDTO> agregarRepuesto(@PathVariable @Min(1) Long tareaId,
                                                            @RequestBody RepuestoUsadoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.agregarRepuesto(tareaId, dto));
    }

    @PostMapping(path = "/{id}/cerrar", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<OrdenDTO> cerrar(@PathVariable @Min(1) Long id, @RequestBody OrdenDTO dto) {
        return ResponseEntity.ok(ordenService.cerrar(id, dto));
    }

    @GetMapping("/{id}/factura")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<FacturaOrdenDTO> factura(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(ordenService.generarFactura(id));
    }

    @GetMapping("/codigo/{codigo}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<OrdenDTO> buscarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(ordenService.buscarPorCodigoExacto(codigo));
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(ordenService.listarPorVehiculo(vehiculoId));
    }

    @GetMapping("/plan/{planId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(ordenService.listarPorPlan(planId));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorEstado(@PathVariable EstadoOrden estado) {
        return ResponseEntity.ok(ordenService.listarPorEstado(estado));
    }

    @GetMapping("/tipo/{tipo}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorTipo(@PathVariable TipoOrden tipo) {
        return ResponseEntity.ok(ordenService.listarPorTipo(tipo));
    }

    @GetMapping("/responsable/{usuarioId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorResponsable(@PathVariable Long usuarioId,
                                                               @RequestParam(required = false) EstadoOrden estado) {
        return ResponseEntity.ok(ordenService.listarPorResponsable(usuarioId, estado));
    }

    @GetMapping("/rango")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<OrdenDTO>> listarPorRango(@RequestParam LocalDateTime desde,
                                                          @RequestParam LocalDateTime hasta,
                                                          @RequestParam(required = false) EstadoOrden estado) {
        return ResponseEntity.ok(ordenService.listarPorRangoApertura(desde, hasta, estado));
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<OrdenDTO> resumenPorRango(@RequestParam LocalDateTime desde,
                                                    @RequestParam LocalDateTime hasta,
                                                    @RequestParam(required = false) EstadoOrden estado) {
        return ResponseEntity.ok(ordenService.resumenTotalesPorRango(desde, hasta, estado));
    }

    @GetMapping("/reportes/detallado")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<ReporteMantenimientoDetalladoDTO>> reporteDetallado(@RequestParam LocalDateTime desde,
                                                                                   @RequestParam LocalDateTime hasta,
                                                                                   @RequestParam(required = false) Long vehiculoId,
                                                                                   @RequestParam(required = false) EstadoOrden estado) {
        return ResponseEntity.ok(ordenService.generarReporteDetallado(desde, hasta, vehiculoId, estado));
    }

    @GetMapping("/reportes/detallado/codigo/{codigo}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<ReporteMantenimientoDetalladoDTO> reporteDetalladoPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(ordenService.generarReporteDetalladoPorCodigo(codigo));
    }

    @GetMapping(value = "/reportes/detallado/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<byte[]> reporteDetalladoPdf(@RequestParam LocalDateTime desde,
                                                      @RequestParam LocalDateTime hasta,
                                                      @RequestParam(required = false) Long vehiculoId,
                                                      @RequestParam(required = false) EstadoOrden estado) {
        byte[] pdf = ordenService.generarReporteDetalladoPdf(desde, hasta, vehiculoId, estado);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("reporte_mantenimiento_detallado.pdf").build());
        headers.setCacheControl(CacheControl.noCache().getHeaderValue());
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
