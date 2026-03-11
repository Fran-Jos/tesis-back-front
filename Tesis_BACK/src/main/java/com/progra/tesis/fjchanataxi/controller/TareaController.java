package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.TareaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.service.TareaService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/tareas", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class TareaController {

    private final TareaService tareaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<List<TareaDTO>> listar(@RequestParam(required = false) String nombre) {
        return ResponseEntity.ok(tareaService.listar(nombre));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<TareaDTO> crear(@RequestBody TareaDTO dto) {
        TareaDTO creada = tareaService.crear(dto.getOrdenId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<TareaDTO> obtener(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(tareaService.obtener(id));
    }

    @GetMapping("/orden/{ordenId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<TareaDTO>> listarPorOrden(@PathVariable @Min(1) Long ordenId) {
        return ResponseEntity.ok(tareaService.listarPorOrden(ordenId));
    }

    @GetMapping("/orden/{ordenId}/conteo")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<Long> contarPorOrden(@PathVariable @Min(1) Long ordenId) {
        return ResponseEntity.ok(tareaService.contarPorOrden(ordenId));
    }

    @GetMapping("/tecnico/{usuarioId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<TareaDTO>> listarPorTecnico(@PathVariable @Min(1) Long usuarioId,
                                                           @RequestParam(required = false) EstadoTarea estado) {
        return ResponseEntity.ok(tareaService.listarPorTecnico(usuarioId, estado));
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<TareaDTO> actualizar(@PathVariable @Min(1) Long id, @RequestBody TareaDTO dto) {
        return ResponseEntity.ok(tareaService.actualizar(id, dto));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<TareaDTO> actualizarEstado(@PathVariable @Min(1) Long id,
                                                     @RequestParam EstadoTarea estado) {
        return ResponseEntity.ok(tareaService.actualizarEstado(id, estado));
    }

    @PatchMapping("/{id}/asignacion")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<TareaDTO> actualizarAsignacion(@PathVariable @Min(1) Long id,
                                                         @RequestParam(required = false) Long usuarioId) {
        return ResponseEntity.ok(tareaService.actualizarAsignacion(id, usuarioId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        tareaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

