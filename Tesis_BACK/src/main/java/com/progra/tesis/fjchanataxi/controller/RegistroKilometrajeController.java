package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.RegistroKilometrajeDTO;
import com.progra.tesis.fjchanataxi.service.RegistroKilometrajeService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(value = "/registrokm", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class RegistroKilometrajeController {

    private final RegistroKilometrajeService registroService;

    // http://localhost:8080/API/v1.0/Mantenimiento/registrokm
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<RegistroKilometrajeDTO> crear(@RequestBody RegistroKilometrajeDTO dto) {
        RegistroKilometrajeDTO creado = registroService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/registrokm/vehiculo/1
    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RegistroKilometrajeDTO>> listarPorVehiculo(@PathVariable("vehiculoId") Long vehiculoId) {
        return ResponseEntity.ok(registroService.listarPorVehiculo(vehiculoId));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/registrokm/usuario/1
    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RegistroKilometrajeDTO>> listarPorUsuario(@PathVariable("usuarioId") Long usuarioId) {
        return ResponseEntity.ok(registroService.listarPorUsuario(usuarioId));
    }

    @GetMapping("/vehiculo/{vehiculoId}/rango")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<RegistroKilometrajeDTO>> listarPorRango(@PathVariable("vehiculoId") Long vehiculoId,
                                                                       @RequestParam("desde") LocalDateTime desde,
                                                                       @RequestParam("hasta") LocalDateTime hasta) {
        return ResponseEntity.ok(registroService.listarPorRangoFecha(vehiculoId, desde, hasta));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/registrokm/vehiculo/3/ultimo
    @GetMapping("/vehiculo/{vehiculoId}/ultimo")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<RegistroKilometrajeDTO> ultimo(@PathVariable("vehiculoId") @Min(1) Long vehiculoId) {
        return ResponseEntity.ok(registroService.ultimoDeVehiculo(vehiculoId));
    }
}
