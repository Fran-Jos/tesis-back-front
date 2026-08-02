package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.ConfiguracionSistemaDTO;
import com.progra.tesis.fjchanataxi.model.ConfiguracionSistema;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.ConfiguracionSistemaRepository;
import com.progra.tesis.fjchanataxi.security.UserPrincipal;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConfiguracionSistemaServiceImpl implements ConfiguracionSistemaService {
    private static final long CONFIG_ID = 1L;
    private final ConfiguracionSistemaRepository repository;

    @Override
    @Transactional
    public ConfiguracionSistema obtenerEntidad() {
        ConfiguracionSistema c = repository.findById(CONFIG_ID).orElseGet(() -> repository.save(configuracionInicial()));
        if (c.getNotificacionNavegadorHabilitada() == null) {
            c.setNotificacionNavegadorHabilitada(true);
            c = repository.save(c);
        }
        return c;
    }

    @Override
    @Transactional(readOnly = true)
    public ConfiguracionSistemaDTO obtener() {
        return toDTO(repository.findById(CONFIG_ID).orElse(configuracionInicial()));
    }

    @Override
    @Transactional
    public ConfiguracionSistemaDTO actualizar(ConfiguracionSistemaDTO dto) {
        validar(dto);
        ConfiguracionSistema c = obtenerEntidad();
        c.setUmbralKmProxima(dto.getUmbralKmProxima());
        c.setUmbralKmCritica(dto.getUmbralKmCritica());
        c.setUmbralDiasProxima(dto.getUmbralDiasProxima());
        c.setUmbralDiasCritica(dto.getUmbralDiasCritica());
        c.setEvaluacionAutomatica(valor(dto.getEvaluacionAutomatica()));
        c.setIntervaloEvaluacionMinutos(dto.getIntervaloEvaluacionMinutos());
        c.setModalHabilitado(valor(dto.getModalHabilitado()));
        c.setNotificacionNavegadorHabilitada(valor(dto.getNotificacionNavegadorHabilitada()));
        c.setHorizonteAlertasDias(dto.getHorizonteAlertasDias());
        c.setIvaPredeterminado(dto.getIvaPredeterminado());
        c.setActualizadoEn(LocalDateTime.now());
        c.setActualizadoPor(usuarioActual());
        return toDTO(repository.save(c));
    }

    private void validar(ConfiguracionSistemaDTO d) {
        if (d.getUmbralKmCritica() == null || d.getUmbralKmProxima() == null
                || d.getUmbralKmCritica() < 0 || d.getUmbralKmProxima() <= d.getUmbralKmCritica()) {
            throw new ReglaNegocioException("El umbral próximo en kilómetros debe ser mayor que el crítico");
        }
        if (d.getUmbralDiasCritica() == null || d.getUmbralDiasProxima() == null
                || d.getUmbralDiasCritica() < 0 || d.getUmbralDiasProxima() <= d.getUmbralDiasCritica()) {
            throw new ReglaNegocioException("El umbral próximo en días debe ser mayor que el crítico");
        }
        if (d.getIntervaloEvaluacionMinutos() == null || d.getIntervaloEvaluacionMinutos() < 1
                || d.getHorizonteAlertasDias() == null || d.getHorizonteAlertasDias() < 1) {
            throw new ReglaNegocioException("Los intervalos deben ser mayores que cero");
        }
        if (d.getIvaPredeterminado() == null || d.getIvaPredeterminado().compareTo(BigDecimal.ZERO) < 0
                || d.getIvaPredeterminado().compareTo(new BigDecimal("100")) > 0) {
            throw new ReglaNegocioException("El IVA debe estar entre 0 y 100");
        }
    }

    private ConfiguracionSistema configuracionInicial() {
        return ConfiguracionSistema.builder()
                .id(CONFIG_ID).umbralKmProxima(1500).umbralKmCritica(250)
                .umbralDiasProxima(15).umbralDiasCritica(3)
                .evaluacionAutomatica(true).intervaloEvaluacionMinutos(60)
                .modalHabilitado(true).notificacionNavegadorHabilitada(true).horizonteAlertasDias(30)
                .ivaPredeterminado(new BigDecimal("15.00")).actualizadoEn(LocalDateTime.now()).build();
    }

    private boolean valor(Boolean value) { return Boolean.TRUE.equals(value); }

    private Usuario usuarioActual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal p ? p.getUsuario() : null;
    }

    private ConfiguracionSistemaDTO toDTO(ConfiguracionSistema c) {
        Usuario u = c.getActualizadoPor();
        return ConfiguracionSistemaDTO.builder()
                .umbralKmProxima(c.getUmbralKmProxima()).umbralKmCritica(c.getUmbralKmCritica())
                .umbralDiasProxima(c.getUmbralDiasProxima()).umbralDiasCritica(c.getUmbralDiasCritica())
                .evaluacionAutomatica(c.getEvaluacionAutomatica()).intervaloEvaluacionMinutos(c.getIntervaloEvaluacionMinutos())
                .modalHabilitado(c.getModalHabilitado())
                .notificacionNavegadorHabilitada(c.getNotificacionNavegadorHabilitada() == null
                        ? true : c.getNotificacionNavegadorHabilitada())
                .horizonteAlertasDias(c.getHorizonteAlertasDias()).ivaPredeterminado(c.getIvaPredeterminado())
                .actualizadoEn(c.getActualizadoEn())
                .actualizadoPor(u == null ? null : u.getNombre() + " " + u.getApellido()).build();
    }
}
