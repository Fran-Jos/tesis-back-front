package com.progra.tesis.fjchanataxi.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroKilometrajeDTO {
    private Long id;
    private Long vehiculoId;         // FK
    private String vehiculoPlaca;
    private Long usuarioId;          // opcional: puede venir del token
    private String usuarioNombre;
    private LocalDateTime fecha;
    private Long odometro;
}
