package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.VehiculoDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;
import com.progra.tesis.fjchanataxi.service.VehiculoService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/vehiculos", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class VehiculoController {

    @Autowired
    private  VehiculoService vehiculoService;

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> listar() {
        return ResponseEntity.ok(vehiculoService.listar());
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECNICO')")
    public ResponseEntity<VehiculoDTO> obtenerPorID(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(vehiculoService.obtener(id));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<VehiculoDTO> crear(@RequestBody VehiculoDTO dto) {
        VehiculoDTO creado = vehiculoService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/1
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<VehiculoDTO> actualizar(@PathVariable @Min(1) Long id, @RequestBody VehiculoDTO dto) {
        return ResponseEntity.ok(vehiculoService.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        vehiculoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/placa/{placa}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<VehiculoDTO> buscarPorPlaca(@PathVariable String placa) {
        return ResponseEntity.ok(vehiculoService.buscarPorPlacaExacta(placa));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/placa?q=ABC
    @GetMapping("/placa")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> buscarPorPlacaLike(@RequestParam("q") String query) {
        return ResponseEntity.ok(vehiculoService.buscarPorPlacaLike(query));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/chasis/CH232333
    @GetMapping("/chasis/{chasis}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<VehiculoDTO> buscarPorChasis(@PathVariable String chasis) {
        return ResponseEntity.ok(vehiculoService.buscarPorChasisExacto(chasis));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/marca-modelo?marca=Toyota&modelo=Corolla
    @GetMapping("/marca-modelo")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> buscarPorMarcaModelo(@RequestParam(required = false) String marca,
                                                                  @RequestParam(required = false) String modelo) {
        return ResponseEntity.ok(vehiculoService.buscarPorMarcaModelo(marca, modelo));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/anio?desde=2015&hasta=2020
    @GetMapping("/anio")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> buscarPorRangoAnio(@RequestParam(required = false) Integer desde,
                                                                @RequestParam(required = false) Integer hasta) {
        return ResponseEntity.ok(vehiculoService.buscarPorRangoAnio(desde, hasta));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/estado/ACTIVO
    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> buscarPorEstado(@PathVariable EstadoVehiculo estado) {
        return ResponseEntity.ok(vehiculoService.buscarPorEstado(estado));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/vehiculos/search?q=texto
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<List<VehiculoDTO>> busquedaLibre(@RequestParam("q") String query) {
        return ResponseEntity.ok(vehiculoService.buscarTextoLibre(query));
    }
}
