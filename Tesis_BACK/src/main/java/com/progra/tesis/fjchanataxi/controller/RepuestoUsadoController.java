package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.RepuestoUsadoDTO;
import com.progra.tesis.fjchanataxi.service.RepuestoUsadoService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping(value = "/repuestos-usados", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class RepuestoUsadoController {

    private final RepuestoUsadoService repuestoService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<RepuestoUsadoDTO> crear(@RequestBody RepuestoUsadoDTO dto) {
        RepuestoUsadoDTO creado = repuestoService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RepuestoUsadoDTO>> listar(@RequestParam(required = false) Boolean sinTarea) {
        if (Boolean.TRUE.equals(sinTarea)) {
            return ResponseEntity.ok(repuestoService.listarDisponibles());
        }
        return ResponseEntity.ok(repuestoService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<RepuestoUsadoDTO> obtener(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(repuestoService.obtener(id));
    }

    @GetMapping("/tarea/{tareaId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RepuestoUsadoDTO>> listarPorTarea(@PathVariable @Min(1) Long tareaId) {
        return ResponseEntity.ok(repuestoService.listarPorTarea(tareaId));
    }

    @GetMapping("/orden/{ordenId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RepuestoUsadoDTO>> listarPorOrden(@PathVariable @Min(1) Long ordenId) {
        return ResponseEntity.ok(repuestoService.listarPorOrden(ordenId));
    }

    @GetMapping("/orden/{ordenId}/total")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<BigDecimal> totalPorOrden(@PathVariable @Min(1) Long ordenId) {
        return ResponseEntity.ok(repuestoService.totalPorOrden(ordenId));
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<RepuestoUsadoDTO> actualizar(@PathVariable @Min(1) Long id,
                                                       @RequestBody RepuestoUsadoDTO dto) {
        return ResponseEntity.ok(repuestoService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        repuestoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}