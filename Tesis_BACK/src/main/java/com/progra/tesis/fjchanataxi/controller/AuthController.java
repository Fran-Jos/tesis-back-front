package com.progra.tesis.fjchanataxi.controller;

import com.progra.tesis.fjchanataxi.dto.AuthResponseDTO;
import com.progra.tesis.fjchanataxi.dto.LoginDTO;
import com.progra.tesis.fjchanataxi.security.JwtService;
import com.progra.tesis.fjchanataxi.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/auth", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    // http://localhost:8080/API/v1.0/Mantenimiento/auth/login
    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        AuthResponseDTO response = AuthResponseDTO.builder()
                .token(token)
                .usuarioId(principal.getUsuario().getId())
                .nombreCompleto(principal.getUsuario().getNombre() + " " + principal.getUsuario().getApellido())
                .rol(principal.getUsuario().getRol())
                .build();
        return ResponseEntity.ok(response);
    }
}
