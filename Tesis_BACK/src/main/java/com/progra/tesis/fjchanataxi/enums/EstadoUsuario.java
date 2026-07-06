package com.progra.tesis.fjchanataxi.enums;

public enum EstadoUsuario {

    ACTIVO,
    INACTIVO;
    public boolean esActivo() {
        return this == ACTIVO;
    }
}
