package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.AlertaDTO;
import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.service.AlertaService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value = "/alertas", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService alertaService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','OPERADOR')")
    public ResponseEntity<AlertaDTO> crearOActualizar(@RequestBody AlertaDTO dto) {
        AlertaDTO guardada = alertaService.upsert(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PatchMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<AlertaDTO> cambiarEstado(@PathVariable @Min(1) Long id, @RequestBody AlertaDTO dto) {
        return ResponseEntity.ok(alertaService.cambiarEstado(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        alertaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<AlertaDTO> obtener(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(alertaService.obtener(id));
    }

    @GetMapping("/vehiculo/{vehiculoId}/pendientes")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> pendientesPorVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(alertaService.listarPendientesPorVehiculo(vehiculoId));
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> listarPorVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(alertaService.listarPorVehiculo(vehiculoId));
    }

    @GetMapping("/plan/{planId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> listarPorPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(alertaService.listarPorPlan(planId));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> listarPorEstado(@PathVariable EstadoAlerta estado) {
        return ResponseEntity.ok(alertaService.listarPorEstado(estado));
    }

    @GetMapping("/tipo/{tipo}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> listarPorTipo(@PathVariable TipoAlerta tipo) {
        return ResponseEntity.ok(alertaService.listarPorTipo(tipo));
    }

    @GetMapping("/clasificacion/{clasificacion}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> listarPorClasificacion(@PathVariable ClasificacionAlerta clasificacion) {
        return ResponseEntity.ok(alertaService.listarPorClasificacion(clasificacion));
    }
    @GetMapping("/vencidas")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> vencidasHoy() {
        return ResponseEntity.ok(alertaService.vencidasHoy());
    }

    @GetMapping("/proximas")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> proximas(@RequestParam(defaultValue = "7") int dias) {
        return ResponseEntity.ok(alertaService.proximasEnDias(dias));
    }

    @GetMapping("/rango-fecha")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> buscarPorRangoFecha(@RequestParam LocalDate desde,
                                                               @RequestParam LocalDate hasta,
                                                               @RequestParam(required = false) EstadoAlerta estado) {
        return ResponseEntity.ok(alertaService.buscarPorRangoFecha(desde, hasta, estado));
    }

    @GetMapping("/vehiculo/{vehiculoId}/rango-fecha")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<AlertaDTO>> buscarPorVehiculoYRango(@PathVariable Long vehiculoId,
                                                                   @RequestParam LocalDate desde,
                                                                   @RequestParam LocalDate hasta,
                                                                   @RequestParam(required = false) EstadoAlerta estado) {
        return ResponseEntity.ok(alertaService.buscarPorVehiculoYRango(vehiculoId, desde, hasta, estado));
    }
}
