package com.progra.tesis.fjchanataxi.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.progra.tesis.fjchanataxi.dto.InformeTecnicoVehiculoDTO;
import com.progra.tesis.fjchanataxi.dto.VehiculoDTO;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.model.Alerta;
import com.progra.tesis.fjchanataxi.model.OrdenMantenimiento;
import com.progra.tesis.fjchanataxi.model.PlanMantenimiento;
import com.progra.tesis.fjchanataxi.model.RegistroKilometraje;
import com.progra.tesis.fjchanataxi.model.Usuario;
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

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;

/** Lógica de negocio para Vehículos. */
@Service @RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final PlanMantenimientoRepository planRepository;
    private final OrdenMantenimientoRepository ordenRepository;
    private final RegistroKilometrajeRepository registroRepository;
    private final AlertaRepository alertaRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale LOCALE_EC = new Locale("es", "EC");

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

    /** Genera la ficha técnica consolidada del vehículo identificado por su placa. */
    @Override
    public InformeTecnicoVehiculoDTO generarInformeTecnicoPorPlaca(String placa) {
        Vehiculo vehiculo = cargarVehiculoPorPlaca(placa);

        List<PlanMantenimiento> planes = planRepository.findByVehiculoId(vehiculo.getId());
        List<PlanMantenimiento> planesActivos = planes.stream()
                .filter(plan -> Boolean.TRUE.equals(plan.getActivo()))
                .sorted(Comparator.comparing(p -> p.getNombre() == null ? "" : p.getNombre(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<OrdenMantenimiento> ordenes = ordenRepository.findByVehiculoIdOrderByFechaAperturaDesc(vehiculo.getId());
        List<Alerta> alertas = alertaRepository.findByVehiculoIdOrderByFechaProgramadaAsc(vehiculo.getId());
        RegistroKilometraje ultimoRegistro = registroRepository.findTopByVehiculoIdOrderByFechaDesc(vehiculo.getId())
                .orElse(null);

        return InformeTecnicoVehiculoDTO.builder()
                .vehiculo(mapVehiculoResumen(vehiculo))
                .estadisticas(construirEstadisticas(planes, ordenes, alertas))
                .ultimoKilometraje(mapRegistroKilometraje(ultimoRegistro))
                .ultimaOrden(mapOrdenResumen(ordenes.isEmpty() ? null : ordenes.get(0)))
                .historialOrdenes(ordenes.stream().limit(5).map(this::mapOrdenResumen).toList())
                .planesActivos(planesActivos.stream().map(this::mapPlanResumen).toList())
                .alertasPendientes(alertas.stream()
                        .filter(alerta -> alerta.getEstado() == EstadoAlerta.PENDIENTE)
                        .sorted(Comparator.comparing(Alerta::getFechaProgramada))
                        .limit(5)
                        .map(this::mapAlertaResumen)
                        .toList())
                .build();
    }

    /** Genera el informe técnico en formato PDF listo para descarga. */
    @Override
    public byte[] generarInformeTecnicoPdfPorPlaca(String placa) {
        InformeTecnicoVehiculoDTO informe = generarInformeTecnicoPorPlaca(placa);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            Paragraph title = new Paragraph("Informe técnico del vehículo", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6);
            document.add(title);

            InformeTecnicoVehiculoDTO.VehiculoResumenDTO vehiculo = informe.getVehiculo();
            if (vehiculo != null) {
                Paragraph placaParrafo = new Paragraph("Placa: " + valorOguion(vehiculo.getPlaca()), valueFont);
                placaParrafo.setSpacingAfter(3);
                document.add(placaParrafo);

                String descripcion = vehiculoDescripcionExtendida(vehiculo);
                if (!descripcion.isBlank()) {
                    Paragraph descripcionParrafo = new Paragraph(descripcion, valueFont);
                    descripcionParrafo.setSpacingAfter(6);
                    document.add(descripcionParrafo);
                }
            }

            document.add(new Paragraph("Datos generales", sectionFont));
            PdfPTable datosVehiculo = new PdfPTable(2);
            datosVehiculo.setWidthPercentage(100);
            datosVehiculo.setSpacingAfter(8);

            if (vehiculo != null) {
                addMetaRow(datosVehiculo, "Marca", valorOguion(vehiculo.getMarca()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Modelo", valorOguion(vehiculo.getModelo()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Año", formatEntero(vehiculo.getAnio()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Chasis", valorOguion(vehiculo.getChasis()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Capacidad de carga", formatDecimal(vehiculo.getCapacidadCarga()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Color", valorOguion(vehiculo.getColor()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Kilometraje actual", formatEntero(vehiculo.getKmActual()), labelFont, valueFont);
                addMetaRow(datosVehiculo, "Estado", formatEnum(vehiculo.getEstado()), labelFont, valueFont);
            }
            document.add(datosVehiculo);

            InformeTecnicoVehiculoDTO.EstadisticasVehiculoDTO stats = informe.getEstadisticas();
            if (stats != null) {
                document.add(new Paragraph("Indicadores principales", sectionFont));
                PdfPTable tablaStats = new PdfPTable(2);
                tablaStats.setWidthPercentage(100);
                tablaStats.setSpacingAfter(8);
                addMetaRow(tablaStats, "Planes registrados", formatEntero(stats.getTotalPlanes()), labelFont, valueFont);
                addMetaRow(tablaStats, "Planes activos", formatEntero(stats.getPlanesActivos()), labelFont, valueFont);
                addMetaRow(tablaStats, "Órdenes registradas", formatEntero(stats.getTotalOrdenes()), labelFont, valueFont);
                addMetaRow(tablaStats, "Órdenes abiertas", formatEntero(stats.getOrdenesAbiertas()), labelFont, valueFont);
                addMetaRow(tablaStats, "Órdenes en proceso", formatEntero(stats.getOrdenesEnProceso()), labelFont, valueFont);
                addMetaRow(tablaStats, "Órdenes cerradas", formatEntero(stats.getOrdenesCerradas()), labelFont, valueFont);
                addMetaRow(tablaStats, "Alertas pendientes", formatEntero(stats.getAlertasPendientes()), labelFont, valueFont);
                addMetaRow(tablaStats, "Alertas atendidas", formatEntero(stats.getAlertasAtendidas()), labelFont, valueFont);
                addMetaRow(tablaStats, "Alertas canceladas", formatEntero(stats.getAlertasCanceladas()), labelFont, valueFont);
                document.add(tablaStats);
            }

            InformeTecnicoVehiculoDTO.RegistroKilometrajeResumenDTO ultimoKm = informe.getUltimoKilometraje();
            if (ultimoKm != null) {
                document.add(new Paragraph("Último registro de kilometraje", sectionFont));
                PdfPTable tablaKm = new PdfPTable(2);
                tablaKm.setWidthPercentage(100);
                tablaKm.setSpacingAfter(8);
                addMetaRow(tablaKm, "Fecha", formatFecha(ultimoKm.getFecha()), labelFont, valueFont);
                addMetaRow(tablaKm, "Odómetro", formatEntero(ultimoKm.getOdometro()), labelFont, valueFont);
                addMetaRow(tablaKm, "Registrado por", valorOguion(ultimoKm.getRegistradoPor()), labelFont, valueFont);
                document.add(tablaKm);
            }

            InformeTecnicoVehiculoDTO.OrdenResumenDTO ultimaOrden = informe.getUltimaOrden();
            if (ultimaOrden != null) {
                document.add(new Paragraph("Última orden de mantenimiento", sectionFont));
                PdfPTable tablaOrden = new PdfPTable(2);
                tablaOrden.setWidthPercentage(100);
                tablaOrden.setSpacingAfter(8);
                addMetaRow(tablaOrden, "Código", valorOguion(ultimaOrden.getCodigo()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Estado", formatEnum(ultimaOrden.getEstado()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Tipo", formatEnum(ultimaOrden.getTipo()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Fecha apertura", formatFecha(ultimaOrden.getFechaApertura()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Fecha cierre", formatFecha(ultimaOrden.getFechaCierre()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Responsable", valorOguion(ultimaOrden.getResponsable()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Total", formatMoneda(ultimaOrden.getTotal()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Mano de obra", formatMoneda(ultimaOrden.getTotalManoObra()), labelFont, valueFont);
                addMetaRow(tablaOrden, "Repuestos", formatMoneda(ultimaOrden.getTotalRepuestos()), labelFont, valueFont);
                document.add(tablaOrden);
            }

            if (informe.getHistorialOrdenes() != null && !informe.getHistorialOrdenes().isEmpty()) {
                document.add(new Paragraph("Historial reciente de órdenes", sectionFont));
                PdfPTable historialTabla = new PdfPTable(new float[]{2.2f, 1.4f, 1.8f, 1.8f, 2.2f, 1.4f});
                historialTabla.setWidthPercentage(100);
                historialTabla.setSpacingAfter(8);
                addHeaderCell(historialTabla, "Código", labelFont);
                addHeaderCell(historialTabla, "Estado", labelFont);
                addHeaderCell(historialTabla, "Apertura", labelFont);
                addHeaderCell(historialTabla, "Cierre", labelFont);
                addHeaderCell(historialTabla, "Responsable", labelFont);
                addHeaderCell(historialTabla, "Total", labelFont);

                for (InformeTecnicoVehiculoDTO.OrdenResumenDTO orden : informe.getHistorialOrdenes()) {
                    historialTabla.addCell(createCell(valorOguion(orden.getCodigo()), valueFont));
                    historialTabla.addCell(createCell(formatEnum(orden.getEstado()), valueFont));
                    historialTabla.addCell(createCell(formatFecha(orden.getFechaApertura()), valueFont));
                    historialTabla.addCell(createCell(formatFecha(orden.getFechaCierre()), valueFont));
                    historialTabla.addCell(createCell(valorOguion(orden.getResponsable()), valueFont));
                    historialTabla.addCell(createCell(formatMoneda(orden.getTotal()), valueFont));
                }
                document.add(historialTabla);
            }

            if (informe.getPlanesActivos() != null && !informe.getPlanesActivos().isEmpty()) {
                document.add(new Paragraph("Planes de mantenimiento activos", sectionFont));
                PdfPTable planesTabla = new PdfPTable(new float[]{2.8f, 1.6f, 1.6f, 1.6f, 1.8f});
                planesTabla.setWidthPercentage(100);
                planesTabla.setSpacingAfter(8);
                addHeaderCell(planesTabla, "Nombre", labelFont);
                addHeaderCell(planesTabla, "Frecuencia km", labelFont);
                addHeaderCell(planesTabla, "Frecuencia días", labelFont);
                addHeaderCell(planesTabla, "Próximo km", labelFont);
                addHeaderCell(planesTabla, "Próxima fecha", labelFont);

                for (InformeTecnicoVehiculoDTO.PlanResumenDTO plan : informe.getPlanesActivos()) {
                    planesTabla.addCell(createCell(valorOguion(plan.getNombre()), valueFont));
                    planesTabla.addCell(createCell(formatEntero(plan.getFrecuenciaKm()), valueFont));
                    planesTabla.addCell(createCell(formatEntero(plan.getFrecuenciaDias()), valueFont));
                    planesTabla.addCell(createCell(formatEntero(plan.getProximoKm()), valueFont));
                    planesTabla.addCell(createCell(formatFecha(plan.getProximaFecha()), valueFont));
                }
                document.add(planesTabla);
            }

            if (informe.getAlertasPendientes() != null && !informe.getAlertasPendientes().isEmpty()) {
                document.add(new Paragraph("Alertas pendientes destacadas", sectionFont));
                PdfPTable alertasTabla = new PdfPTable(new float[]{1.8f, 1.6f, 1.8f, 3.2f, 2.2f});
                alertasTabla.setWidthPercentage(100);
                alertasTabla.setSpacingAfter(8);
                addHeaderCell(alertasTabla, "Tipo", labelFont);
                addHeaderCell(alertasTabla, "Clasificación", labelFont);
                addHeaderCell(alertasTabla, "Fecha programada", labelFont);
                addHeaderCell(alertasTabla, "Mensaje", labelFont);
                addHeaderCell(alertasTabla, "Plan", labelFont);

                for (InformeTecnicoVehiculoDTO.AlertaResumenDTO alerta : informe.getAlertasPendientes()) {
                    alertasTabla.addCell(createCell(formatEnum(alerta.getTipo()), valueFont));
                    alertasTabla.addCell(createCell(formatEnum(alerta.getClasificacion()), valueFont));
                    alertasTabla.addCell(createCell(formatFecha(alerta.getFechaProgramada()), valueFont));
                    alertasTabla.addCell(createCell(valorOguion(alerta.getMensaje()), valueFont));
                    alertasTabla.addCell(createCell(valorOguion(alerta.getPlanNombre()), valueFont));
                }
                document.add(alertasTabla);
            } else {
                Paragraph sinAlertas = new Paragraph("No existen alertas pendientes registradas.", valueFont);
                sinAlertas.setSpacingAfter(4);
                document.add(sinAlertas);
            }

            document.close();
            return baos.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new ReglaNegocioException("No fue posible generar el PDF del informe técnico: " + e.getMessage());
        }
    }

    // ---------- helpers ----------
    private InformeTecnicoVehiculoDTO.VehiculoResumenDTO mapVehiculoResumen(Vehiculo vehiculo) {
        return InformeTecnicoVehiculoDTO.VehiculoResumenDTO.builder()
                .id(vehiculo.getId())
                .placa(vehiculo.getPlaca())
                .marca(vehiculo.getMarca())
                .modelo(vehiculo.getModelo())
                .anio(vehiculo.getAnio())
                .chasis(vehiculo.getChasis())
                .capacidadCarga(vehiculo.getCapacidadCarga())
                .color(vehiculo.getColor())
                .kmActual(vehiculo.getKmActual())
                .estado(vehiculo.getEstado())
                .build();
    }

    private InformeTecnicoVehiculoDTO.RegistroKilometrajeResumenDTO mapRegistroKilometraje(RegistroKilometraje registro) {
        if (registro == null) {
            return null;
        }
        return InformeTecnicoVehiculoDTO.RegistroKilometrajeResumenDTO.builder()
                .id(registro.getId())
                .fecha(registro.getFecha())
                .odometro(registro.getOdometro())
                .registradoPor(nombreCompleto(registro.getUsuario()))
                .build();
    }

    private InformeTecnicoVehiculoDTO.OrdenResumenDTO mapOrdenResumen(OrdenMantenimiento orden) {
        if (orden == null) {
            return null;
        }
        return InformeTecnicoVehiculoDTO.OrdenResumenDTO.builder()
                .id(orden.getId())
                .codigo(orden.getCodigo())
                .tipo(orden.getTipo())
                .estado(orden.getEstado())
                .fechaApertura(orden.getFechaApertura())
                .fechaCierre(orden.getFechaCierre())
                .responsable(nombreCompleto(orden.getResponsable()))
                .total(orden.getTotal())
                .totalManoObra(orden.getTotalManoObra())
                .totalRepuestos(orden.getTotalRepuestos())
                .build();
    }

    private InformeTecnicoVehiculoDTO.PlanResumenDTO mapPlanResumen(PlanMantenimiento plan) {
        if (plan == null) {
            return null;
        }
        return InformeTecnicoVehiculoDTO.PlanResumenDTO.builder()
                .id(plan.getId())
                .nombre(plan.getNombre())
                .frecuenciaKm(plan.getFrecuenciaKm())
                .frecuenciaDias(plan.getFrecuenciaDias())
                .proximoKm(plan.getProximoKm())
                .proximaFecha(plan.getProximaFecha())
                .activo(plan.getActivo())
                .build();
    }

    private InformeTecnicoVehiculoDTO.AlertaResumenDTO mapAlertaResumen(Alerta alerta) {
        if (alerta == null) {
            return null;
        }
        return InformeTecnicoVehiculoDTO.AlertaResumenDTO.builder()
                .id(alerta.getId())
                .tipo(alerta.getTipo())
                .clasificacion(alerta.getClasificacion())
                .estado(alerta.getEstado())
                .fechaProgramada(alerta.getFechaProgramada())
                .mensaje(alerta.getMensaje())
                .planNombre(alerta.getPlan() != null ? alerta.getPlan().getNombre() : null)
                .build();
    }

    private InformeTecnicoVehiculoDTO.EstadisticasVehiculoDTO construirEstadisticas(List<PlanMantenimiento> planes,
                                                                                    List<OrdenMantenimiento> ordenes,
                                                                                    List<Alerta> alertas) {
        long totalPlanes = planes.size();
        long planesActivos = planes.stream().filter(plan -> Boolean.TRUE.equals(plan.getActivo())).count();
        long totalOrdenes = ordenes.size();
        long ordenesAbiertas = ordenes.stream().filter(o -> o.getEstado() == EstadoOrden.ABIERTA).count();
        long ordenesEnProceso = ordenes.stream().filter(o -> o.getEstado() == EstadoOrden.EN_PROCESO).count();
        long ordenesCerradas = ordenes.stream().filter(o -> o.getEstado() == EstadoOrden.CERRADA).count();
        long ordenesCanceladas = ordenes.stream().filter(o -> o.getEstado() == EstadoOrden.CANCELADA).count();
        long totalAlertas = alertas.size();
        long alertasPendientes = alertas.stream().filter(a -> a.getEstado() == EstadoAlerta.PENDIENTE).count();
        long alertasAtendidas = alertas.stream().filter(a -> a.getEstado() == EstadoAlerta.ATENDIDA).count();
        long alertasCanceladas = alertas.stream().filter(a -> a.getEstado() == EstadoAlerta.CANCELADA).count();
        return InformeTecnicoVehiculoDTO.EstadisticasVehiculoDTO.builder()
                .totalPlanes(totalPlanes)
                .planesActivos(planesActivos)
                .totalOrdenes(totalOrdenes)
                .ordenesAbiertas(ordenesAbiertas)
                .ordenesEnProceso(ordenesEnProceso)
                .ordenesCerradas(ordenesCerradas)
                .ordenesCanceladas(ordenesCanceladas)
                .totalAlertas(totalAlertas)
                .alertasPendientes(alertasPendientes)
                .alertasAtendidas(alertasAtendidas)
                .alertasCanceladas(alertasCanceladas)
                .build();
    }

    private Vehiculo cargarVehiculoPorPlaca(String placa) {
        String normalizada = normalizarPlaca(placa);
        return vehiculoRepository.findByPlacaIgnoreCase(normalizada)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe vehículo con esa placa"));
    }

    private String nombreCompleto(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        if (usuario.getNombre() != null && !usuario.getNombre().isBlank()) {
            sb.append(usuario.getNombre().trim());
        }
        if (usuario.getApellido() != null && !usuario.getApellido().isBlank()) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(usuario.getApellido().trim());
        }
        String resultado = sb.toString().trim();
        return resultado.isEmpty() ? null : resultado;
    }

    private String vehiculoDescripcionExtendida(InformeTecnicoVehiculoDTO.VehiculoResumenDTO vehiculo) {
        if (vehiculo == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        if (vehiculo.getMarca() != null && !vehiculo.getMarca().isBlank()) {
            sb.append(vehiculo.getMarca().trim());
        }
        if (vehiculo.getModelo() != null && !vehiculo.getModelo().isBlank()) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(vehiculo.getModelo().trim());
        }
        if (vehiculo.getAnio() != null) {
            if (sb.length() > 0) {
                sb.append(" · ");
            }
            sb.append("Año ").append(vehiculo.getAnio());
        }
        if (vehiculo.getColor() != null && !vehiculo.getColor().isBlank()) {
            if (sb.length() > 0) {
                sb.append(" · ");
            }
            sb.append("Color ").append(vehiculo.getColor().trim());
        }
        return sb.toString();
    }

    private void addMetaRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingBottom(4f);
        table.addCell(labelCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingBottom(4f);
        table.addCell(valueCell);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(4f);
        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setPadding(4f);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        return cell;
    }

    private String formatEntero(Number value) {
        if (value == null) {
            return "-";
        }
        NumberFormat nf = NumberFormat.getIntegerInstance(LOCALE_EC);
        nf.setGroupingUsed(true);
        return nf.format(value);
    }

    private String formatDecimal(Number value) {
        if (value == null) {
            return "-";
        }
        NumberFormat nf = NumberFormat.getNumberInstance(LOCALE_EC);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(value);
    }

    private String formatMoneda(BigDecimal value) {
        if (value == null) {
            return "-";
        }
        NumberFormat nf = NumberFormat.getCurrencyInstance(LOCALE_EC);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(value);
    }

    private String formatFecha(LocalDateTime fecha) {
        return fecha == null ? "-" : DATE_TIME_FORMATTER.format(fecha);
    }

    private String formatFecha(LocalDate fecha) {
        return fecha == null ? "-" : DATE_FORMATTER.format(fecha);
    }

    private String formatEnum(Enum<?> value) {
        if (value == null) {
            return "-";
        }
        String texto = value.name().toLowerCase(Locale.ROOT).replace('_', ' ');
        StringBuilder sb = new StringBuilder();
        boolean mayuscula = true;
        for (char c : texto.toCharArray()) {
            if (Character.isSpaceChar(c)) {
                sb.append(' ');
                mayuscula = true;
            } else if (mayuscula) {
                sb.append(Character.toUpperCase(c));
                mayuscula = false;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String valorOguion(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

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
