package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.InformeTecnicoVehiculoDTO;
import com.progra.tesis.fjchanataxi.dto.VehiculoDTO;

import com.progra.tesis.fjchanataxi.enums.EstadoVehiculo;

import java.util.List;

public interface VehiculoService {

    VehiculoDTO crear(VehiculoDTO dto);                       // Alta
    VehiculoDTO actualizar(Long id, VehiculoDTO dto);         // Update parcial
    void eliminar(Long id);                                            // Baja
    VehiculoDTO obtener(Long id);                             // Detalle
    List<VehiculoDTO> listar();                               // Listado

    // Búsquedas
    VehiculoDTO buscarPorPlacaExacta(String placa);
    List<VehiculoDTO> buscarPorPlacaLike(String textoPlaca);
    VehiculoDTO buscarPorChasisExacto(String chasis);
    List<VehiculoDTO> buscarPorMarcaModelo(String marca, String modelo);
    List<VehiculoDTO> buscarPorRangoAnio(Integer desde, Integer hasta);
    List<VehiculoDTO> buscarPorEstado(EstadoVehiculo estado);
    List<VehiculoDTO> buscarTextoLibre(String q);

    InformeTecnicoVehiculoDTO generarInformeTecnicoPorPlaca(String placa);
    byte[] generarInformeTecnicoPdfPorPlaca(String placa);
}
