package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.UsuarioDTO;
import com.progra.tesis.fjchanataxi.dto.UsuarioRespuestaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.service.UsuarioService;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/usuarios", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin
@Validated
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/1
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR','TECNICO')")
    public ResponseEntity<UsuarioRespuestaDTO> obtenerPorID(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(usuarioService.obtener(id));
    }
    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/cedula/1723456789
    @GetMapping("/cedula/{cedula}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<UsuarioRespuestaDTO> buscarPorCedula(@PathVariable String cedula) {
        return ResponseEntity.ok(usuarioService.buscarPorCedula(cedula));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/email/admin@tesis.com
    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<UsuarioRespuestaDTO> buscarPorEmail(@PathVariable String email) {
        return ResponseEntity.ok(usuarioService.buscarPorEmail(email));
    }

    /** http://localhost:8080/API/v1.0/Mantenimiento/usuarios
     *  Ejemplos:
     *   - /buscar?nombre=Juan
     *   - /buscar?apellido=Perez
     *   - /buscar?nombre=Juan&apellido=Perez
     */
    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> buscarPorNombreApellido(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String apellido) {
        return ResponseEntity.ok(usuarioService.buscarPorNombreYApellido(nombre, apellido));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/nombre/juan
    @GetMapping("/nombre/{nombre}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> buscarPorNombre(@PathVariable String nombre) {
        return ResponseEntity.ok(usuarioService.buscarPorNombre(nombre));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/apellido/chana
    @GetMapping("/apellido/{apellido}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> buscarPorApellido(@PathVariable String apellido) {
        return ResponseEntity.ok(usuarioService.buscarPorApellido(apellido));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/rol/ADMIN
    @GetMapping("/rol/{rol}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> buscarPorRol(@PathVariable Rol rol) {
        return ResponseEntity.ok(usuarioService.buscarPorRol(rol));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/estado/ACTIVO
    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> buscarPorEstado(@PathVariable EstadoUsuario estado) {
        return ResponseEntity.ok(usuarioService.buscarPorEstado(estado));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/search?q=texto
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    public ResponseEntity<List<UsuarioRespuestaDTO>> search(@RequestParam String q) {
        return ResponseEntity.ok(usuarioService.buscarTextoLibre(q));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioRespuestaDTO> crear(@RequestBody UsuarioDTO dto) {
        UsuarioRespuestaDTO created = usuarioService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/1
     *  Actualiza parcialmente un usuario existente (solo campos enviados).
     *  Reglas de negocio: valida colisiones de email/cédula en el service.
     */
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioRespuestaDTO> actualizar(@PathVariable @Min(1) Long id,
                                                          @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    // http://localhost:8080/API/v1.0/Mantenimiento/usuarios/1
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable @Min(1) Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
