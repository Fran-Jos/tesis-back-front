package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.ConfiguracionSistemaDTO;
import com.progra.tesis.fjchanataxi.model.ConfiguracionSistema;

public interface ConfiguracionSistemaService {
    ConfiguracionSistema obtenerEntidad();
    ConfiguracionSistemaDTO obtener();
    ConfiguracionSistemaDTO actualizar(ConfiguracionSistemaDTO dto);
}
