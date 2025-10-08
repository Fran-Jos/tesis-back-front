package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.UsuarioDTO;
import com.progra.tesis.fjchanataxi.dto.UsuarioRespuestaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;

import java.util.List;

public interface UsuarioService {

    UsuarioRespuestaDTO crear(UsuarioDTO dto);                    // Crea un usuario
    UsuarioRespuestaDTO actualizar(Long id, UsuarioDTO dto);      // Actualiza parcialmente
    void eliminar(Long id);                                       // Elimina por id
    UsuarioRespuestaDTO obtener(Long id);                         // Detalle por id
    List<UsuarioRespuestaDTO> listar();                           // Listado general

    // Búsquedas
    UsuarioRespuestaDTO buscarPorCedula(String cedula);           // Exacta
    UsuarioRespuestaDTO buscarPorEmail(String email);             // Exacta
    List<UsuarioRespuestaDTO> buscarPorNombre(String nombre);     // Like
    List<UsuarioRespuestaDTO> buscarPorApellido(String apellido); // Like
    List<UsuarioRespuestaDTO> buscarPorNombreYApellido(String nombre, String apellido); // Like ambos
    List<UsuarioRespuestaDTO> buscarPorRol(Rol rol);              // Por rol
    List<UsuarioRespuestaDTO> buscarPorEstado(EstadoUsuario estado); // Por estado
    List<UsuarioRespuestaDTO> buscarTextoLibre(String q);         // nombre, apellido, email, cédula (like)
}
