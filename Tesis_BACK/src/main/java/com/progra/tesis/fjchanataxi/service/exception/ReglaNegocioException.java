package com.progra.tesis.fjchanataxi.service.exception;

/**
 * Excepción para reglas de negocio incumplidas.
 */
public class ReglaNegocioException extends RuntimeException {
    public ReglaNegocioException(String message) {
        super(message);
    }
}
