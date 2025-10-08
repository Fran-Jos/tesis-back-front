package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.PlanDTO;
import com.progra.tesis.fjchanataxi.service.PlanMantenimientoService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/planes", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class PlanMantenimientoController {

    private final PlanMantenimientoService planService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<PlanDTO> obtener(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(planService.obtener(id));
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> listarPorVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(planService.listarPorVehiculo(vehiculoId));
    }

    @GetMapping("/vehiculo/{vehiculoId}/activos")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> listarActivosPorVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(planService.listarActivosPorVehiculo(vehiculoId));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> listarActivos() {
        return ResponseEntity.ok(planService.listarActivos());
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(planService.buscarPorNombreLike(nombre));
    }

    @GetMapping("/vehiculo/{vehiculoId}/proximos-km")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> proximosPorKm(@PathVariable Long vehiculoId,
                                                        @RequestParam(defaultValue = "1500") int umbralKm) {
        return ResponseEntity.ok(planService.proximosPorKm(vehiculoId, umbralKm));
    }

    @GetMapping("/vehiculo/{vehiculoId}/vencidos-km")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> vencidosPorKm(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(planService.vencidosPorKm(vehiculoId));
    }

    @GetMapping("/vehiculo/{vehiculoId}/proximos-fecha")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> proximosPorFecha(@PathVariable Long vehiculoId,
                                                           @RequestParam(defaultValue = "30") int umbralDias) {
        return ResponseEntity.ok(planService.proximosPorFecha(vehiculoId, umbralDias));
    }

    @GetMapping("/vehiculo/{vehiculoId}/vencidos-fecha")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<PlanDTO>> vencidosPorFecha(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(planService.vencidosPorFecha(vehiculoId));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/planes
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<PlanDTO> crear(@RequestBody PlanDTO dto) {
        PlanDTO creado = planService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<PlanDTO> actualizar(@PathVariable @Min(1) Long id, @RequestBody PlanDTO dto) {
        return ResponseEntity.ok(planService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        planService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
