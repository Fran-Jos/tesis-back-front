package com.progra.tesis.fjchanataxi.service;

import com.progra.tesis.fjchanataxi.dto.VehiculoDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.model.Vehiculo;
import com.progra.tesis.fjchanataxi.repository.AlertaRepository;
import com.progra.tesis.fjchanataxi.repository.OrdenMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.PlanMantenimientoRepository;
import com.progra.tesis.fjchanataxi.repository.RegistroKilometrajeRepository;
import com.progra.tesis.fjchanataxi.repository.VehiculoRepository;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

/** Lógica de negocio para Vehículos. */
@Service @RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final PlanMantenimientoRepository planRepository;
    private final OrdenMantenimientoRepository ordenRepository;
    private final RegistroKilometrajeRepository registroRepository;
    private final AlertaRepository alertaRepository;

    /** Crea un vehículo validando unicidad de placa. */
    @Override
    public VehiculoDTO crear(VehiculoDTO dto) {

        String placa = normalizarPlaca(dto.getPlaca());
        if (vehiculoRepository.existsByPlacaIgnoreCase(placa))
            throw new ReglaNegocioException("Ya existe un vehículo con esa placa");

        Vehiculo e = dtoToEntity(dto, new Vehiculo());
        e.setPlaca(placa); // normalización de placa
        return entityToDTO(vehiculoRepository.save(e));
    }

    /** Actualiza parcialmente un vehículo. Controla colisión de placa. */
    @Override
    public VehiculoDTO actualizar(Long id, VehiculoDTO dto) {
        Vehiculo e = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));

        // Validar y actualizar placa si se envía
        if (dto.getPlaca() != null) {
            String nuevaPlaca = normalizarPlaca(dto.getPlaca());
            Long idActual = e.getId();
            vehiculoRepository.findByPlacaIgnoreCase(nuevaPlaca)
                    .filter(v -> !v.getId().equals(idActual))
                    .ifPresent(v -> { throw new ReglaNegocioException("La placa ya está en uso"); });
            e.setPlaca(nuevaPlaca);
        }

        // Actualizar otros campos
        e = dtoToEntity(dto, e);

        // Guardar y devolver DTO actualizado
        return entityToDTO(vehiculoRepository.save(e));
    }

    /** Elimina un vehículo por id. */
    @Override
    public void eliminar(Long id) {
        Vehiculo e = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));

        List<String> bloqueos = new ArrayList<>();
        long planes = planRepository.countByVehiculoId(id);
        if (planes > 0) {
            bloqueos.add(formatoBloqueo(planes,
                    "plan de mantenimiento asociado",
                    "planes de mantenimiento asociados",
                    "Elimine o reasigne esos planes"));
        }
        long ordenesTotales = ordenRepository.countByVehiculoId(id);
        if (ordenesTotales > 0) {
            long ordenesActivas = ordenRepository.countByVehiculoIdAndEstadoIn(id, EnumSet.of(EstadoOrden.ABIERTA, EstadoOrden.EN_PROCESO));
            String detalleActivas = ordenesActivas > 0
                    ? String.format(", de las cuales %d %s en curso",
                    ordenesActivas,
                    ordenesActivas == 1 ? "está" : "están")
                    : "";
            bloqueos.add(String.format("tiene %d %s%s. Cierre, reasigne o elimine dichas órdenes",
                    ordenesTotales,
                    ordenesTotales == 1 ? "orden de mantenimiento registrada" : "órdenes de mantenimiento registradas",
                    detalleActivas));
        }
        long registros = registroRepository.countByVehiculoId(id);
        if (registros > 0) {
            bloqueos.add(formatoBloqueo(registros,
                    "registro de kilometraje asociado",
                    "registros de kilometraje asociados",
                    "Elimine el historial de kilometraje"));
        }
        long alertas = alertaRepository.countByVehiculoId(id);
        if (alertas > 0) {
            bloqueos.add(formatoBloqueo(alertas,
                    "alerta pendiente o histórica",
                    "alertas pendientes o históricas",
                    "Revise y elimine esas alertas"));
        }
        if (!bloqueos.isEmpty()) {
            String detalle = String.join(". ", bloqueos);
            throw new ReglaNegocioException(String.format(
                    "No se puede eliminar el vehículo %s porque %s.",
                    e.getPlaca(), detalle));
        }
        vehiculoRepository.delete(e);
    }

    /** Obtiene detalle por id. */
    @Override
    public VehiculoDTO obtener(Long id) {
        return vehiculoRepository.findById(id).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    /** Lista general de vehículos. */
    @Override
    public List<VehiculoDTO> listar() {
        return vehiculoRepository.findAll().stream().map(this::entityToDTO).toList();
    }

    /** Busca por placa exacta. */
    @Override
    public VehiculoDTO buscarPorPlacaExacta(String placa) {
        String p = normalizarPlaca(placa);
        return vehiculoRepository.findByPlacaIgnoreCase(p).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe vehículo con esa placa"));
    }

    /** Busca por placa (like). */
    @Override
    public List<VehiculoDTO> buscarPorPlacaLike(String textoPlaca) {
        String t = normalizarLike(textoPlaca); validarMinimo(t, 2, "Mínimo 2 caracteres");
        return vehiculoRepository.findByPlacaContainingIgnoreCase(t).stream().map(this::entityToDTO).toList();
    }

    /** Busca por chasis exacto. */
    @Override
    public VehiculoDTO buscarPorChasisExacto(String chasis) {
        String c = limpiar(chasis).toUpperCase();
        if (c.isBlank()) throw new ReglaNegocioException("El chasis es obligatorio");
        return vehiculoRepository.findByChasisIgnoreCase(c).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe vehículo con ese chasis"));
    }

    /** Busca por marca y/o modelo (like). */
    @Override
    public List<VehiculoDTO> buscarPorMarcaModelo(String marca, String modelo) {
        String m1 = normalizarLike(marca), m2 = normalizarLike(modelo);
        if (m1.isBlank() && m2.isBlank()) throw new ReglaNegocioException("Debe especificar marca y/o modelo");
        if (m1.isBlank()) return vehiculoRepository.findByModeloContainingIgnoreCase(m2).stream().map(this::entityToDTO).toList();
        if (m2.isBlank()) return vehiculoRepository.findByMarcaContainingIgnoreCase(m1).stream().map(this::entityToDTO).toList();
        return vehiculoRepository.findByMarcaContainingIgnoreCaseAndModeloContainingIgnoreCase(m1, m2)
                .stream().map(this::entityToDTO).toList();
    }

    /** Busca por rango de año. */
    @Override
    public List<VehiculoDTO> buscarPorRangoAnio(Integer desde, Integer hasta) {
        if (desde == null && hasta == null) throw new ReglaNegocioException("Indique al menos un extremo");
        int d = desde != null ? desde : Integer.MIN_VALUE;
        int h = hasta != null ? hasta : Integer.MAX_VALUE;
        if (desde != null && hasta != null && d > h) throw new ReglaNegocioException("Rango de años inválido");
        return vehiculoRepository.findByAnioBetween(d, h).stream().map(this::entityToDTO).toList();
    }

    /** Lista por estado. */
    @Override
    public List<VehiculoDTO> buscarPorEstado(com.progra.tesis.fjchanataxi.enums.EstadoVehiculo estado) {
        if (estado == null) throw new ReglaNegocioException("El estado es obligatorio");
        return vehiculoRepository.findByEstado(estado).stream().map(this::entityToDTO).toList();
    }

    /** Búsqueda libre (placa, marca, modelo, chasis). */
    @Override
    public List<VehiculoDTO> buscarTextoLibre(String q) {
        String s = normalizarLike(q); validarMinimo(s, 2, "Mínimo 2 caracteres");
        String[] tokens = s.split("\\s+"); var acum = new ArrayList<Vehiculo>();
        for (String t : tokens) {
            if (t.length() < 2) continue;
            List<Vehiculo> parc = vehiculoRepository.searchPlacaMarcaModeloChasis(t);
            for (Vehiculo v : parc) if (!acum.contains(v)) acum.add(v);
        }
        return acum.stream().map(this::entityToDTO).toList();
    }

    // ---------- helpers ----------
    private Vehiculo dtoToEntity(VehiculoDTO dto, Vehiculo e) {
        if (dto.getMarca() != null) e.setMarca(dto.getMarca().trim());
        if (dto.getModelo() != null) e.setModelo(dto.getModelo().trim());
        if (dto.getAnio() != null) e.setAnio(dto.getAnio());
        if (dto.getChasis() != null) e.setChasis(limpiar(dto.getChasis()).toUpperCase());
        if (dto.getCapacidadCarga() != null) e.setCapacidadCarga(dto.getCapacidadCarga());
        if (dto.getColor() != null) e.setColor(dto.getColor().trim());
        if (dto.getKmActual() != null) e.setKmActual(dto.getKmActual());
        if (dto.getEstado() != null) e.setEstado(dto.getEstado());
        return e;
    }

    private VehiculoDTO entityToDTO(Vehiculo e) {
        return VehiculoDTO.builder()
                .id(e.getId()).placa(e.getPlaca()).marca(e.getMarca()).modelo(e.getModelo())
                .anio(e.getAnio()).chasis(e.getChasis()).capacidadCarga(e.getCapacidadCarga())
                .color(e.getColor()).kmActual(e.getKmActual()).estado(e.getEstado()).build();
    }

    private String limpiar(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " "); }

    private String normalizarLike(String s) {
        String base = limpiar(s); String nfd = Normalizer.normalize(base, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}", "");
    }
    private String normalizarPlaca(String placa) {
        String normalizada = limpiar(placa).toUpperCase();
        if (normalizada.isBlank()) throw new ReglaNegocioException("La placa es obligatoria");
        return normalizada;
    }

    private void validarMinimo(String s, int min, String msg) {
        if (s == null || s.length() < min) throw new ReglaNegocioException(msg);
    }

    private String formatoBloqueo(long cantidad, String singular, String plural, String accion) {
        String descripcion = cantidad == 1 ? singular : plural;
        return String.format("tiene %d %s. %s primero", cantidad, descripcion, accion);
    }
}
