package com.progra.tesis.fjchanataxi.service.exception;

/**
 * Excepción para recursos no encontrados.
 */
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}
