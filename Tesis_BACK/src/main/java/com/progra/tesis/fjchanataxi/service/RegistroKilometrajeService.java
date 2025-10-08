package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.RegistroKilometrajeDTO;


import java.time.LocalDateTime;
import java.util.List;

public interface RegistroKilometrajeService {

    RegistroKilometrajeDTO crear(RegistroKilometrajeDTO dto); // Registra km, actualiza odómetro y alertas
    List<RegistroKilometrajeDTO> listarPorVehiculo(Long vehiculoId);
    List<RegistroKilometrajeDTO> listarPorUsuario(Long usuarioId);
    List<RegistroKilometrajeDTO> listarPorRangoFecha(Long vehiculoId, LocalDateTime desde, LocalDateTime hasta);
    RegistroKilometrajeDTO ultimoDeVehiculo(Long vehiculoId);
}
