package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.UsuarioDTO;
import com.progra.tesis.fjchanataxi.dto.UsuarioRespuestaDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.AlertaRepository;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RegistroKilometrajeRepository;
import com.progra.tesis.fjchanataxi.repository.TareaRepository;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;


@Service @RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrdenMantenimientoRepository ordenRepository;
    private final TareaRepository tareaRepository;
    private final RegistroKilometrajeRepository registroRepository;
    private final AlertaRepository alertaRepository;

    // Crea un usuario validando unicidad de email y cédula.
    @Override
    public UsuarioRespuestaDTO crear(UsuarioDTO dto) {
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new ReglaNegocioException("El email es obligatorio");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new ReglaNegocioException("La contraseña es obligatoria");
        }
        if (dto.getEmail() != null && usuarioRepository.existsByEmail(dto.getEmail()))
            throw new ReglaNegocioException("Ya existe un usuario con ese email");
        if (dto.getCedula() != null && usuarioRepository.existsByCedula(dto.getCedula()))
            throw new ReglaNegocioException("Ya existe un usuario con esa cédula");

        Usuario entidad = dtoToEntity(dto, new Usuario());
        return entityToDTO(usuarioRepository.save(entidad));
    }

    /** Actualiza parcialmente un usuario. Controla colisiones de email/cédula. */
    @Override
    public UsuarioRespuestaDTO actualizar(Long id, UsuarioDTO dto) {
        Usuario e = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        if (dto.getEmail() != null && !dto.getEmail().equals(e.getEmail())
                && usuarioRepository.existsByEmail(dto.getEmail()))
            throw new ReglaNegocioException("Email ya está en uso");

        if (dto.getCedula() != null && (e.getCedula() == null || !dto.getCedula().equals(e.getCedula()))
                && usuarioRepository.existsByCedula(dto.getCedula()))
            throw new ReglaNegocioException("Cédula ya está en uso");

        e = dtoToEntity(dto, e);
        return entityToDTO(usuarioRepository.save(e));
    }

    /** Elimina un usuario por id (si no existe, 404). */
    @Override
    public void eliminar(Long id) {
        Usuario e = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
        List<String> bloqueos = new ArrayList<>();
        long ordenesCreadas = ordenRepository.countByCreadoPorId(id);
        if (ordenesCreadas > 0) {
            bloqueos.add(formatoBloqueo(ordenesCreadas,
                    "orden de mantenimiento creada por el usuario",
                    "órdenes de mantenimiento creadas por el usuario",
                    "Actualiza esas órdenes para asignar otro creador"));
        }
        long ordenesTotalResponsable = ordenRepository.countByResponsableId(id);
        if (ordenesTotalResponsable > 0) {
            long ordenesActivas = ordenRepository.countByResponsableIdAndEstadoIn(id, EnumSet.of(EstadoOrden.ABIERTA, EstadoOrden.EN_PROCESO));
            String detalleActivas = ordenesActivas > 0
                    ? String.format(", con %d %s en curso",
                    ordenesActivas,
                    ordenesActivas == 1 ? "orden" : "órdenes")
                    : "";
            bloqueos.add(String.format("figura como responsable en %d %s%s. Reasigna esas órdenes antes de eliminar al usuario",
                    ordenesTotalResponsable,
                    ordenesTotalResponsable == 1 ? "orden" : "órdenes",
                    detalleActivas));
        }
        long tareasAsignadas = tareaRepository.countByAsignadoAId(id);
        if (tareasAsignadas > 0) {
            bloqueos.add(formatoBloqueo(tareasAsignadas,
                    "tarea asignada",
                    "tareas asignadas",
                    "Reasigna o elimina esas tareas"));
        }
        long registros = registroRepository.countByUsuarioId(id);
        if (registros > 0) {
            bloqueos.add(formatoBloqueo(registros,
                    "registro de kilometraje ingresado",
                    "registros de kilometraje ingresados",
                    "Elimina o reasigna esos registros"));
        }
        long alertasCreadas = alertaRepository.countByCreadaPorId(id);
        if (alertasCreadas > 0) {
            bloqueos.add(formatoBloqueo(alertasCreadas,
                    "alerta registrada",
                    "alertas registradas",
                    "Actualiza o elimina esas alertas"));
        }
        if (!bloqueos.isEmpty()) {
            String detalle = String.join(". ", bloqueos);
            throw new ReglaNegocioException(String.format(
                    "No se puede eliminar al usuario %s %s porque %s.",
                    e.getNombre(), e.getApellido(), detalle));
        }
        usuarioRepository.delete(e);
    }

    /** Obtiene detalle por id. */
    @Override
    public UsuarioRespuestaDTO obtener(Long id) {
        return usuarioRepository.findById(id).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    /** Lista todos los usuarios. */
    @Override
    public List<UsuarioRespuestaDTO> listar() {
        return usuarioRepository.findAll().stream().map(this::entityToDTO).toList();
    }

    /** Busca por cédula (exacta). */
    @Override
    public UsuarioRespuestaDTO buscarPorCedula(String cedula) {
        String c = limpiar(cedula);
        if (c.isBlank()) throw new ReglaNegocioException("La cédula es obligatoria");
        return usuarioRepository.findByCedula(c).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe usuario con esa cédula"));
    }

    /** Busca por email (exacto, case-insensitive). */
    @Override
    public UsuarioRespuestaDTO buscarPorEmail(String email) {
        String e = limpiar(email).toLowerCase();
        if (e.isBlank()) throw new ReglaNegocioException("El email es obligatorio");
        return usuarioRepository.findByEmailIgnoreCase(e).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe usuario con ese email"));
    }

    /** Busca por nombre (like, sin acentos). */
    @Override
    public List<UsuarioRespuestaDTO> buscarPorNombre(String nombre) {
        String n = normalizarLike(nombre); validarMinimo(n, 2, "El nombre debe tener al menos 2 caracteres");
        return usuarioRepository.findByNombreContainingIgnoreCase(n).stream().map(this::entityToDTO).toList();
    }

    /** Busca por apellido (like). */
    @Override
    public List<UsuarioRespuestaDTO> buscarPorApellido(String apellido) {
        String a = normalizarLike(apellido); validarMinimo(a, 2, "El apellido debe tener al menos 2 caracteres");
        return usuarioRepository.findByApellidoContainingIgnoreCase(a).stream().map(this::entityToDTO).toList();
    }

    /** Busca por nombre y apellido (like ambos). */
    @Override
    public List<UsuarioRespuestaDTO> buscarPorNombreYApellido(String nombre, String apellido) {
        String n = normalizarLike(nombre), a = normalizarLike(apellido);
        if (n.isBlank() && a.isBlank()) throw new ReglaNegocioException("Debe especificar nombre y/o apellido");
        if (n.isBlank()) return buscarPorApellido(a);
        if (a.isBlank()) return buscarPorNombre(n);
        validarMinimo(n, 2, "El nombre debe tener al menos 2 caracteres");
        validarMinimo(a, 2, "El apellido debe tener al menos 2 caracteres");
        return usuarioRepository.findByNombreContainingIgnoreCaseAndApellidoContainingIgnoreCase(n, a)
                .stream().map(this::entityToDTO).toList();
    }

    /** Lista por rol. */
    @Override
    public List<UsuarioRespuestaDTO> buscarPorRol(Rol rol) {
        if (rol == null) throw new ReglaNegocioException("El rol es obligatorio");
        return usuarioRepository.findByRol(rol).stream().map(this::entityToDTO).toList();
    }

    /** Lista por estado. */
    @Override
    public List<UsuarioRespuestaDTO> buscarPorEstado(EstadoUsuario estado) {
        if (estado == null) throw new ReglaNegocioException("El estado es obligatorio");
        return usuarioRepository.findByEstado(estado).stream().map(this::entityToDTO).toList();
    }

    /** Búsqueda libre (nombre, apellido, email, cédula). Tokeniza y quita duplicados. */
    @Override
    public List<UsuarioRespuestaDTO> buscarTextoLibre(String q) {
        String s = normalizarLike(q); validarMinimo(s, 2, "Mínimo 2 caracteres");
        String[] tokens = s.split("\\s+");
        var acum = new ArrayList<Usuario>();
        for (String t : tokens) {
            if (t.length() < 2) continue;
            List<Usuario> parc = usuarioRepository.searchNombreApellidoEmailCedula(t);
            for (Usuario u : parc) if (!acum.contains(u)) acum.add(u);
        }
        return acum.stream().map(this::entityToDTO).toList();
    }

    // ---------- helpers de mapeo y validación ----------
    private Usuario dtoToEntity(UsuarioDTO dto, Usuario e) {
        if (dto.getNombre() != null) e.setNombre(dto.getNombre().trim());
        if (dto.getApellido() != null) e.setApellido(dto.getApellido().trim());
        if (dto.getCedula() != null) e.setCedula(limpiar(dto.getCedula()));
        if (dto.getNumeroCelular() != null) e.setNumeroCelular(dto.getNumeroCelular());
        if (dto.getEmail() != null) e.setEmail(limpiar(dto.getEmail()).toLowerCase());
        if (dto.getPassword() != null) e.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getRol() != null) {
            e.setRol(dto.getRol());
        } else if (e.getRol() == null) {
            e.setRol(Rol.OPERADOR);
        }
        if (dto.getEstado() != null) {
            e.setEstado(dto.getEstado());
        } else if (e.getEstado() == null) {
            e.setEstado(EstadoUsuario.ACTIVO);
        }
        return e;
    }

    private UsuarioRespuestaDTO entityToDTO(Usuario e) {
        return UsuarioRespuestaDTO.builder()
                .id(e.getId()).nombre(e.getNombre()).apellido(e.getApellido())
                .cedula(e.getCedula()).numeroCelular(e.getNumeroCelular())
                .email(e.getEmail()).rol(e.getRol()).estado(e.getEstado()).build();
    }

    private String limpiar(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " "); }

    private String normalizarLike(String s) {
        String base = limpiar(s); String nfd = Normalizer.normalize(base, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}", "");
    }

    private void validarMinimo(String s, int min, String msg) {
        if (s == null || s.length() < min) throw new ReglaNegocioException(msg);
    }

    private String formatoBloqueo(long cantidad, String singular, String plural, String accion) {
        String descripcion = cantidad == 1 ? singular : plural;
        return String.format("tiene %d %s. %s primero", cantidad, descripcion, accion);
    }
}
