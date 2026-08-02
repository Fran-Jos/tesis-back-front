package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.ConfiguracionSistemaDTO;
import com.progra.tesis.fjchanataxi.service.ConfiguracionSistemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/configuracion")
@RequiredArgsConstructor
public class ConfiguracionSistemaController {
    private final ConfiguracionSistemaService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConfiguracionSistemaDTO> obtener() {
        return ResponseEntity.ok(service.obtener());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConfiguracionSistemaDTO> actualizar(@RequestBody ConfiguracionSistemaDTO dto) {
        return ResponseEntity.ok(service.actualizar(dto));
    }

    @GetMapping("/notificaciones")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO','OPERADOR')")
    public ResponseEntity<Map<String, Object>> notificaciones() {
        var c = service.obtenerEntidad();
        return ResponseEntity.ok(Map.of(
                "modalHabilitado", c.getModalHabilitado(),
                "notificacionNavegadorHabilitada", c.getNotificacionNavegadorHabilitada(),
                "horizonteAlertasDias", c.getHorizonteAlertasDias()
        ));
    }
}
