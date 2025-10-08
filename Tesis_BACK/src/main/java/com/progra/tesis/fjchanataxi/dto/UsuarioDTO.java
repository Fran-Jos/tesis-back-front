package com.progra.tesis.fjchanataxi.dto;

import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {
    private Long id;
    private String nombre;
    private String apellido;
    private String cedula;
    private String numeroCelular;
    private String email;
    private String password;
    private Rol rol;
    private EstadoUsuario estado;
}
