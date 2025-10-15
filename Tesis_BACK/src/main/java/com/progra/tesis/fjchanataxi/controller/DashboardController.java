package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.dashboard.DashboardSummaryDTO;
import com.progra.tesis.fjchanataxi.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/dashboard", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<DashboardSummaryDTO> resumen() {
        return ResponseEntity.ok(dashboardService.obtenerResumen());
    }
}
