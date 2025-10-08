package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.Rol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String token;
    private Long usuarioId;
    private String nombreCompleto;
    private Rol rol;
}
