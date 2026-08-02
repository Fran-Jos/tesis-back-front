package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.service.MotorAlertasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/motor-alertas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class MotorAlertasController {
    private final MotorAlertasService motor;

    @PostMapping("/evaluar")
    public ResponseEntity<Map<String, Object>> evaluar() {
        int planes = motor.evaluarTodosLosPlanes();
        return ResponseEntity.ok(Map.of("planesEvaluados", planes, "resultado", "COMPLETADO"));
    }
}
