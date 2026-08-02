package com.progra.tesis.fjchanataxi.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.progra.tesis.fjchanataxi.dto.*;
import com.progra.tesis.fjchanataxi.enums.ClasificacionAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoAlerta;
import com.progra.tesis.fjchanataxi.enums.EstadoOrden;
import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import com.progra.tesis.fjchanataxi.enums.TipoAlerta;
import com.progra.tesis.fjchanataxi.enums.TipoOrden;
import com.progra.tesis.fjchanataxi.model.*;
import com.progra.tesis.fjchanataxi.repository.*;
import com.progra.tesis.fjchanataxi.security.UserPrincipal;
import com.progra.tesis.fjchanataxi.service.exception.ReglaNegocioException;
import com.progra.tesis.fjchanataxi.service.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/** Lógica de negocio para Órdenes de Mantenimiento. */
@Service @RequiredArgsConstructor
public class OrdenMantenimientoServiceImpl implements OrdenMantenimientoService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale LOCALE_ES_EC = new Locale("es", "EC");

    private final OrdenMantenimientoRepository ordenRepo;
    private final VehiculoRepository vehiculoRepo;
    private final PlanMantenimientoRepository planRepo;
    private final UsuarioRepository usuarioRepo;
    private final TareaRepository tareaRepo;
    private final RepuestoUsadoRepository repuestoRepo;
    private final AlertaRepository alertaRepo;
    private final RegistroKilometrajeRepository registroKmRepo;
    private final ConfiguracionSistemaService configuracionSistemaService;
    private final MotorAlertasService motorAlertasService;

    /** Crea una OM y opcionalmente añade tareas. Recalcula totales. */
    @Override
    public OrdenDTO crear(OrdenDTO dto) {
        if (dto.getCodigo() == null || dto.getCodigo().isBlank()) {
            throw new ReglaNegocioException("El código es obligatorio");
        }
        if (ordenRepo.findByCodigo(dto.getCodigo().trim()).isPresent())
            throw new ReglaNegocioException("Código de orden ya existe");

        if (dto.getVehiculoId() == null) {
            throw new ReglaNegocioException("El vehículo es obligatorio");
        }
        Vehiculo vehiculo = vehiculoRepo.findById(dto.getVehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
        PlanMantenimiento plan = (dto.getPlanId() != null)
                ? planRepo.findById(dto.getPlanId()).orElseThrow(() -> new RecursoNoEncontradoException("Plan no existe"))
                : null;
        Usuario creadoPor = (dto.getCreadoPorId() != null)
                ? usuarioRepo.findById(dto.getCreadoPorId()).orElseThrow(() -> new RecursoNoEncontradoException("Usuario (creadoPor) no existe"))
                : null;
        Usuario responsable = (dto.getResponsableId() != null)
                ? usuarioRepo.findById(dto.getResponsableId()).orElseThrow(() -> new RecursoNoEncontradoException("Usuario (responsable) no existe"))
                : null;

        OrdenMantenimiento om = new OrdenMantenimiento();
        om.setCodigo(dto.getCodigo().trim());
        om.setTipo(dto.getTipo() != null ? dto.getTipo() : TipoOrden.CORRECTIVA);
        om.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoOrden.ABIERTA);
        om.setVehiculo(vehiculo);
        om.setPlan(plan);
        om.setCreadoPor(creadoPor);
        om.setResponsable(responsable);
        om.setFechaApertura(dto.getFechaApertura() != null ? dto.getFechaApertura() : LocalDateTime.now());
        om.setFechaCierre(dto.getFechaCierre());
        om.setDetalle(normalizarTexto(dto.getDetalle()));

        om.setTotalManoObra(BigDecimal.ZERO);
        om.setTotalRepuestos(BigDecimal.ZERO);
        om.setSubtotal(BigDecimal.ZERO);
        // Política administrativa: el formulario operativo no puede sobrescribir el IVA.
        om.setIvaPorc(configuracionSistemaService.obtenerEntidad().getIvaPredeterminado());
        om.setIvaValor(BigDecimal.ZERO);
        om.setTotal(BigDecimal.ZERO);
        om = ordenRepo.save(om);

        if (dto.getTareas() != null) {
            for (TareaDTO t : dto.getTareas()) agregarTareaInterno(om, t);
        }

        recalcularTotales(om);
        return entityToDTO(ordenRepo.save(om));
    }

    /** Obtiene detalle de la orden por id. */
    @Override public OrdenDTO obtener(Long id) {
        return ordenRepo.findById(id).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
    }

    /** Lista todas las órdenes. */
    @Override public List<OrdenDTO> listar() {
        return ordenRepo.findAll().stream().map(this::entityToDTO).toList();
    }

    @Override
    public List<OrdenDTO> listarParaSelector(String busqueda) {
        String filtro = normalizarBusqueda(busqueda);
        return ordenRepo.findAllByOrderByFechaAperturaDesc().stream()
                .filter(orden -> filtro.isBlank() || coincideBusquedaSelector(orden, filtro))
                .sorted(Comparator
                        .comparing((OrdenMantenimiento orden) -> prioridadEstadoSelector(orden.getEstado()))
                        .thenComparing(OrdenMantenimiento::getFechaApertura,
                                Comparator.nullsLast(LocalDateTime::compareTo).reversed()))
                .map(this::entityToDTO)
                .toList();
    }

    /** Actualiza datos generales de la orden sin tocar sus tareas. */
    @Override
    public OrdenDTO actualizar(Long id, OrdenDTO dto) {
        if (id == null || id <= 0) {
            throw new ReglaNegocioException("El identificador de la orden es obligatorio");
        }

        OrdenMantenimiento om = ordenRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        boolean cerrarDesdeActualizacion = false;

        if (dto.getCodigo() != null) {
            String codigo = dto.getCodigo().trim();
            if (codigo.isBlank()) {
                throw new ReglaNegocioException("El código es obligatorio");
            }
            if (!codigo.equalsIgnoreCase(om.getCodigo())
                    && ordenRepo.findByCodigo(codigo).isPresent()) {
                throw new ReglaNegocioException("Código de orden ya existe");
            }
            om.setCodigo(codigo);
        }

        if (dto.getTipo() != null) {
            om.setTipo(dto.getTipo());
        }

        if (dto.getEstado() != null) {
            if (om.getEstado() == EstadoOrden.CERRADA && dto.getEstado() != EstadoOrden.CERRADA) {
                throw new ReglaNegocioException("No es posible reabrir una orden que ya fue cerrada");
            }
            cerrarDesdeActualizacion = om.getEstado() != EstadoOrden.CERRADA && dto.getEstado() == EstadoOrden.CERRADA;
            om.setEstado(dto.getEstado());
        }

        if (dto.getVehiculoId() != null && !dto.getVehiculoId().equals(om.getVehiculo().getId())) {
            Vehiculo vehiculo = vehiculoRepo.findById(dto.getVehiculoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no existe"));
            om.setVehiculo(vehiculo);
        }

        if (dto.getPlanId() != null) {
            PlanMantenimiento plan = planRepo.findById(dto.getPlanId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Plan no existe"));
            if (!plan.getVehiculo().getId().equals(om.getVehiculo().getId())) {
                throw new ReglaNegocioException("El plan seleccionado pertenece a otro vehículo");
            }
            om.setPlan(plan);
        }
        if (dto.getPlanId() == null && om.getPlan() != null) {
            om.setPlan(null);
        }

        if (dto.getResponsableId() != null) {
            Usuario responsable = usuarioRepo.findById(dto.getResponsableId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Usuario (responsable) no existe"));
            om.setResponsable(responsable);
        }
        if (dto.getResponsableId() == null) {
            om.setResponsable(null);
        }

        if (dto.getFechaApertura() != null) {
            om.setFechaApertura(dto.getFechaApertura());
        }
        if (cerrarDesdeActualizacion) {
            om.setFechaCierre(LocalDateTime.now());
            om.setCerradoPor(obtenerUsuarioAutenticado());
        } else if (dto.getFechaCierre() != null) {
            om.setFechaCierre(dto.getFechaCierre());
        }

        if (dto.getDetalle() != null) {
            om.setDetalle(normalizarTexto(dto.getDetalle()));
        }


        recalcularTotales(om);
        OrdenMantenimiento actualizado = ordenRepo.save(om);
        if (cerrarDesdeActualizacion && actualizado.getTipo() == TipoOrden.PREVENTIVA && actualizado.getPlan() != null) {
            actualizarPlanDespuesDeOrden(actualizado);
            atenderAlertasDelPlan(actualizado);
            motorAlertasService.evaluarPlan(actualizado.getPlan().getId());
        }
        return entityToDTO(actualizado);
    }

    /** Elimina una orden por id (si tu negocio lo permite). */
    @Override public void eliminar(Long id) {
        OrdenMantenimiento om = ordenRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        ordenRepo.delete(om);
    }

    /** Agrega una tarea a la OM y recalcula totales. */
    @Override
    public TareaDTO agregarTarea(Long ordenId, TareaDTO dto) {
        OrdenMantenimiento om = ordenRepo.findById(ordenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        validarOrdenPermiteAgregarTareas(om);
        Tarea t = agregarTareaInterno(om, dto);
        recalcularTotales(om); ordenRepo.save(om);
        return tareaToDTO(t);
    }

    /** Agrega un repuesto a una tarea y recalcula totales de la OM. */
    @Override
    public RepuestoUsadoDTO agregarRepuesto(Long tareaId, RepuestoUsadoDTO dto) {
        Tarea t = tareaRepo.findById(tareaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tarea no encontrada"));
        RepuestoUsado r = new RepuestoUsado();
        r.setTarea(t);
        r.setDescripcion(dto.getDescripcion());
        r.setCantidad(dto.getCantidad());
        r.setCostoUnitario(dto.getCostoUnitario());
        r = repuestoRepo.save(r);

        OrdenMantenimiento om = t.getOrden();
        recalcularTotales(om); ordenRepo.save(om);
        return repuestoToDTO(r);
    }

    /** Cierra la OM: recalcula totales, marca como CERRADA y atiende alertas de KM del plan. */
    @Override
    public OrdenDTO cerrar(Long ordenId, OrdenDTO dto) {
        if (ordenId == null || ordenId <= 0) {
            throw new ReglaNegocioException("El identificador de la orden es obligatorio");
        }
        OrdenMantenimiento om = ordenRepo.findById(ordenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        if (om.getEstado() == EstadoOrden.CERRADA)
            throw new ReglaNegocioException("La orden ya está cerrada");

        recalcularTotales(om);
        om.setFechaCierre(LocalDateTime.now());
        om.setCerradoPor(obtenerUsuarioAutenticado());
        om.setEstado(EstadoOrden.CERRADA);
        ordenRepo.save(om);

        if (om.getTipo() == TipoOrden.PREVENTIVA && om.getPlan() != null) {
            actualizarPlanDespuesDeOrden(om);
            atenderAlertasDelPlan(om);
            motorAlertasService.evaluarPlan(om.getPlan().getId());
        }
        return entityToDTO(om);
    }

    // ---- búsquedas ----
    @Override
    public OrdenDTO buscarPorCodigoExacto(String codigo) {
        String c = codigo == null ? "" : codigo.trim();
        return ordenRepo.findByCodigo(c).map(this::entityToDTO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe orden con ese código"));
    }

    @Override public List<OrdenDTO> listarPorVehiculo(Long vehiculoId) {
        return ordenRepo.findByVehiculoIdOrderByFechaAperturaDesc(vehiculoId).stream().map(this::entityToDTO).toList();
    }

    @Override public List<OrdenDTO> listarPorPlan(Long planId) {
        return ordenRepo.findByPlanIdOrderByFechaAperturaDesc(planId).stream().map(this::entityToDTO).toList();
    }

    @Override public List<OrdenDTO> listarPorEstado(EstadoOrden estado) {
        return ordenRepo.findByEstadoOrderByFechaAperturaDesc(estado).stream().map(this::entityToDTO).toList();
    }

    @Override public List<OrdenDTO> listarPorTipo(TipoOrden tipo) {
        return ordenRepo.findByTipoOrderByFechaAperturaDesc(tipo).stream().map(this::entityToDTO).toList();
    }

    @Override public List<OrdenDTO> listarPorResponsable(Long usuarioId, EstadoOrden soloEstado) {
        if (soloEstado != null)
            return ordenRepo.findByResponsableIdAndEstadoOrderByFechaAperturaDesc(usuarioId, soloEstado)
                    .stream().map(this::entityToDTO).toList();
        return ordenRepo.findByResponsableIdOrderByFechaAperturaDesc(usuarioId)
                .stream().map(this::entityToDTO).toList();
    }

    @Override public List<OrdenDTO> listarPorRangoApertura(LocalDateTime desde, LocalDateTime hasta, EstadoOrden estado) {
        if (estado != null)
            return ordenRepo.findByEstadoAndFechaAperturaBetweenOrderByFechaAperturaDesc(estado, desde, hasta)
                    .stream().map(this::entityToDTO).toList();
        return ordenRepo.findByFechaAperturaBetweenOrderByFechaAperturaDesc(desde, hasta)
                .stream().map(this::entityToDTO).toList();
    }

    /** Calcula sumatoria de totales para reporte/estadística. */
    @Override
    public OrdenDTO resumenTotalesPorRango(LocalDateTime desde, LocalDateTime hasta, EstadoOrden estado) {
        var lista = listarPorRangoApertura(desde, hasta, estado);
        var manoObra = lista.stream().map(OrdenDTO::getTotalManoObra).filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var repuestos = lista.stream().map(OrdenDTO::getTotalRepuestos).filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var subtotal = lista.stream().map(OrdenDTO::getSubtotal).filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var iva = lista.stream().map(OrdenDTO::getIvaValor).filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var total = lista.stream().map(OrdenDTO::getTotal).filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return OrdenDTO.builder()
                .cantidad(lista.size())
                .totalManoObra(manoObra)
                .totalRepuestos(repuestos)
                .subtotal(subtotal)
                .ivaValor(iva)
                .total(total)
                .build();
    }

    /** Reporte detallado en formato estructurado para visualización. */
    @Override
    public List<ReporteMantenimientoDetalladoDTO> generarReporteDetallado(LocalDateTime desde, LocalDateTime hasta,
                                                                          Long vehiculoId, EstadoOrden estado) {
        if (desde != null && hasta != null && hasta.isBefore(desde)) {
            throw new ReglaNegocioException("La fecha fin debe ser mayor o igual a la fecha de inicio");
        }

        List<OrdenMantenimiento> ordenes = (estado != null)
                ? ordenRepo.findByEstadoOrderByFechaAperturaDesc(estado)
                : ordenRepo.findAll().stream()
                .sorted(Comparator.comparing(OrdenMantenimiento::getFechaApertura,
                        Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .toList();

        if (vehiculoId != null) {
            ordenes = ordenes.stream()
                    .filter(o -> o.getVehiculo() != null && vehiculoId.equals(o.getVehiculo().getId()))
                    .toList();
        }
        if (desde != null) {
            ordenes = ordenes.stream()
                    .filter(o -> o.getFechaApertura() != null && !o.getFechaApertura().isBefore(desde))
                    .toList();
        }
        if (hasta != null) {
            ordenes = ordenes.stream()
                    .filter(o -> o.getFechaApertura() != null && !o.getFechaApertura().isAfter(hasta))
                    .toList();
        }

        return ordenes.stream()
                .map(this::ordenToReporteDetallado)
                .toList();
    }

    /** Genera el PDF del reporte detallado para descarga. */
    @Override
    public byte[] generarReporteDetalladoPdf(LocalDateTime desde, LocalDateTime hasta, Long vehiculoId, EstadoOrden estado) {
        var data = generarReporteDetallado(desde, hasta, vehiculoId, estado);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            Paragraph title = new Paragraph("Reporte detallado de mantenimiento", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6);
            document.add(title);

            Paragraph periodo = new Paragraph(
                    String.format("Periodo: %s - %s", formatFecha(desde), formatFecha(hasta)), valueFont);
            periodo.setSpacingAfter(3);
            document.add(periodo);

            if (vehiculoId != null) {
                String vehiculoTexto;
                if (!data.isEmpty()) {
                    var first = data.get(0);
                    String descripcion = first.getVehiculoDescripcion() != null && !first.getVehiculoDescripcion().isBlank()
                            ? " - " + first.getVehiculoDescripcion() : "";
                    vehiculoTexto = first.getVehiculoPlaca() != null
                            ? first.getVehiculoPlaca() + descripcion : String.valueOf(vehiculoId);
                } else {
                    vehiculoTexto = String.valueOf(vehiculoId);
                }
                Paragraph vehiculo = new Paragraph("Vehículo filtrado: " + vehiculoTexto, valueFont);
                vehiculo.setSpacingAfter(3);
                document.add(vehiculo);
            }

            if (estado != null) {
                Paragraph estadoFiltro = new Paragraph("Estado filtrado: " + estado.name(), valueFont);
                estadoFiltro.setSpacingAfter(3);
                document.add(estadoFiltro);
            }

            document.add(Chunk.NEWLINE);

            if (data.isEmpty()) {
                document.add(new Paragraph("No se encontraron órdenes en el periodo indicado.", valueFont));
            } else {
                for (ReporteMantenimientoDetalladoDTO orden : data) {
                    Paragraph header = new Paragraph(
                            String.format("Orden %s (%s)", orden.getCodigo(),
                                    orden.getEstado() != null ? orden.getEstado().name() : ""), sectionFont);
                    header.setSpacingAfter(4);
                    document.add(header);

                    PdfPTable meta = new PdfPTable(2);
                    meta.setWidthPercentage(100);
                    meta.setSpacingAfter(6);

                    addMetaRow(meta, "Vehículo",
                            concatValores(orden.getVehiculoPlaca(), orden.getVehiculoDescripcion()), labelFont, valueFont);
                    addMetaRow(meta, "Plan", valorOguion(orden.getPlanNombre()), labelFont, valueFont);
                    addMetaRow(meta, "Detalle", valorOguion(orden.getDetalle()), labelFont, valueFont);
                    addMetaRow(meta, "Kilometraje", formatKilometraje(orden.getKilometraje()), labelFont, valueFont);
                    addMetaRow(meta, "Responsable", valorOguion(orden.getResponsableNombre()), labelFont, valueFont);
                    addMetaRow(meta, "Cerrado por", valorOguion(orden.getCerradoPorNombre()), labelFont, valueFont);
                    addMetaRow(meta, "Fecha apertura", formatFecha(orden.getFechaApertura()), labelFont, valueFont);
                    addMetaRow(meta, "Fecha cierre", valorOguion(formatFechaNullable(orden.getFechaCierre())), labelFont, valueFont);
                    addMetaRow(meta, "Mano de obra", formatMoneda(orden.getTotalManoObra()), labelFont, valueFont);
                    addMetaRow(meta, "Repuestos", formatMoneda(orden.getTotalRepuestos()), labelFont, valueFont);
                    addMetaRow(meta, "Subtotal", formatMoneda(orden.getSubtotal()), labelFont, valueFont);
                    addMetaRow(meta, "IVA", formatMoneda(orden.getIvaValor()), labelFont, valueFont);
                    addMetaRow(meta, "Total", formatMoneda(orden.getTotal()), labelFont, valueFont);

                    document.add(meta);

                    PdfPTable tareas = new PdfPTable(new float[]{3f, 1.2f, 2.2f, 1f, 1.4f, 1.4f, 1.4f, 2.8f});
                    tareas.setWidthPercentage(100);
                    tareas.setSpacingAfter(10);

                    addHeaderCell(tareas, "Tarea", labelFont);
                    addHeaderCell(tareas, "Estado", labelFont);
                    addHeaderCell(tareas, "Técnico", labelFont);
                    addHeaderCell(tareas, "Horas", labelFont);
                    addHeaderCell(tareas, "Mano de obra", labelFont);
                    addHeaderCell(tareas, "Repuestos", labelFont);
                    addHeaderCell(tareas, "Total tarea", labelFont);
                    addHeaderCell(tareas, "Detalle repuestos", labelFont);

                    for (ReporteTareaDetalladaDTO tarea : orden.getTareas()) {
                        tareas.addCell(createCell(tarea.getDescripcion(), valueFont));
                        tareas.addCell(createCell(tarea.getEstado() != null ? tarea.getEstado().name() : "-", valueFont));
                        tareas.addCell(createCell(tarea.getAsignadoANombre(), valueFont));
                        tareas.addCell(createCell(tarea.getHoras() != null ? tarea.getHoras().toString() : "-", valueFont));
                        tareas.addCell(createCell(formatMoneda(tarea.getCostoManoObra()), valueFont));
                        tareas.addCell(createCell(formatMoneda(tarea.getTotalRepuestos()), valueFont));
                        tareas.addCell(createCell(formatMoneda(tarea.getTotalTarea()), valueFont));
                        String repuestosDetalle = tarea.getRepuestos() == null || tarea.getRepuestos().isEmpty()
                                ? "-"
                                : tarea.getRepuestos().stream()
                                .map(r -> String.format("%s (%s x %s)", valorOguion(r.getDescripcion()),
                                        formatCantidad(r.getCantidad()), formatMoneda(r.getCostoUnitario())))
                                .collect(Collectors.joining("\n"));
                        tareas.addCell(createCell(repuestosDetalle, valueFont));
                    }

                    if (orden.getTareas().isEmpty()) {
                        PdfPCell emptyCell = new PdfPCell(new Phrase("No existen tareas registradas", valueFont));
                        emptyCell.setColspan(8);
                        emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                        tareas.addCell(emptyCell);
                    }

                    document.add(tareas);
                }

                document.add(new Paragraph("Totales del periodo", sectionFont));
                PdfPTable totales = new PdfPTable(2);
                totales.setWidthPercentage(60);
                totales.setSpacingBefore(5);

                addMetaRow(totales, "Órdenes evaluadas", String.valueOf(data.size()), labelFont, valueFont);
                BigDecimal totalManoObra = data.stream().map(ReporteMantenimientoDetalladoDTO::getTotalManoObra)
                        .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalRepuestos = data.stream().map(ReporteMantenimientoDetalladoDTO::getTotalRepuestos)
                        .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalSubtotal = data.stream().map(ReporteMantenimientoDetalladoDTO::getSubtotal)
                        .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalIva = data.stream().map(ReporteMantenimientoDetalladoDTO::getIvaValor)
                        .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalGeneral = data.stream().map(ReporteMantenimientoDetalladoDTO::getTotal)
                        .filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);

                addMetaRow(totales, "Total mano de obra", formatMoneda(totalManoObra), labelFont, valueFont);
                addMetaRow(totales, "Total repuestos", formatMoneda(totalRepuestos), labelFont, valueFont);
                addMetaRow(totales, "Subtotal", formatMoneda(totalSubtotal), labelFont, valueFont);
                addMetaRow(totales, "IVA", formatMoneda(totalIva), labelFont, valueFont);
                addMetaRow(totales, "Total general", formatMoneda(totalGeneral), labelFont, valueFont);

                document.add(totales);
            }

            document.close();
            return baos.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new ReglaNegocioException("No fue posible generar el PDF del reporte: " + e.getMessage());
        }
    }

    /** Genera la factura de una orden que ya fue atendida (cerrada). */
    @Override
    public FacturaOrdenDTO generarFactura(Long ordenId) {
        if (ordenId == null || ordenId <= 0) {
            throw new ReglaNegocioException("Debe indicar el identificador de la orden");
        }

        OrdenMantenimiento om = ordenRepo.findById(ordenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Orden no encontrada"));
        if (om.getEstado() != EstadoOrden.CERRADA) {
            throw new ReglaNegocioException("La orden debe estar cerrada para generar la factura");
        }

        return ordenToFactura(om);
    }

    /** Reporte detallado de una orden específica identificada por su código. */
    @Override
    public ReporteMantenimientoDetalladoDTO generarReporteDetalladoPorCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ReglaNegocioException("Debe indicar el código de la orden");
        }

        return ordenRepo.findByCodigo(codigo.trim())
                .map(this::ordenToReporteDetallado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe orden con ese código"));
    }

    // ---- helpers internos ----
    private FacturaOrdenDTO ordenToFactura(OrdenMantenimiento orden) {
        List<FacturaTareaDTO> tareas = orden.getTareas() != null
                ? orden.getTareas().stream()
                .sorted(Comparator.comparing(Tarea::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::tareaToFactura)
                .toList()
                : List.of();

        Vehiculo vehiculo = orden.getVehiculo();
        String vehiculoDescripcion = concatValores(
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio() != null ? vehiculo.getAnio().toString() : null);
        vehiculoDescripcion = vehiculoDescripcion.isBlank() ? null : vehiculoDescripcion;

        return FacturaOrdenDTO.builder()
                .ordenId(orden.getId())
                .codigo(orden.getCodigo())
                .fechaApertura(orden.getFechaApertura())
                .fechaCierre(orden.getFechaCierre())
                .vehiculoPlaca(vehiculo.getPlaca())
                .vehiculoDescripcion(vehiculoDescripcion)
                .responsableNombre(nombreCompleto(orden.getResponsable()))
                .cerradoPorNombre(nombreCompleto(orden.getCerradoPor()))
                .kilometraje(obtenerUltimoKmVehiculo(vehiculo))
                .detalle(orden.getDetalle())
                .totalManoObra(orden.getTotalManoObra())
                .totalRepuestos(orden.getTotalRepuestos())
                .subtotal(orden.getSubtotal())
                .ivaPorc(orden.getIvaPorc())
                .ivaValor(orden.getIvaValor())
                .total(orden.getTotal())
                .tareas(tareas)
                .build();
    }

    private FacturaTareaDTO tareaToFactura(Tarea tarea) {
        List<FacturaRepuestoDTO> repuestos = tarea.getRepuestos() != null
                ? tarea.getRepuestos().stream()
                .sorted(Comparator.comparing(RepuestoUsado::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::repuestoToFactura)
                .toList()
                : List.of();

        BigDecimal totalRepuestos = repuestos.stream()
                .map(FacturaRepuestoDTO::getCostoTotal)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal manoObra = nvl(tarea.getCostoManoObra());
        BigDecimal totalTarea = manoObra.add(totalRepuestos);

        return FacturaTareaDTO.builder()
                .descripcion(tarea.getDescripcion())
                .estado(tarea.getEstado() != null ? tarea.getEstado().name() : null)
                .tecnicoAsignado(nombreCompleto(tarea.getAsignadoA()))
                .costoManoObra(manoObra)
                .totalRepuestos(totalRepuestos)
                .totalTarea(totalTarea)
                .repuestos(repuestos)
                .build();
    }

    private FacturaRepuestoDTO repuestoToFactura(RepuestoUsado repuesto) {
        BigDecimal cantidad = nvl(repuesto.getCantidad());
        BigDecimal costoUnitario = nvl(repuesto.getCostoUnitario());
        BigDecimal total = cantidad.multiply(costoUnitario);

        return FacturaRepuestoDTO.builder()
                .descripcion(repuesto.getDescripcion())
                .cantidad(cantidad)
                .costoUnitario(costoUnitario)
                .costoTotal(total)
                .build();
    }

    private ReporteMantenimientoDetalladoDTO ordenToReporteDetallado(OrdenMantenimiento orden) {
        List<ReporteTareaDetalladaDTO> tareas = orden.getTareas() != null
                ? orden.getTareas().stream()
                .sorted(Comparator.comparing(Tarea::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::tareaToReporteDetallado)
                .toList()
                : List.of();

        Vehiculo vehiculo = orden.getVehiculo();
        String vehiculoDescripcion = concatValores(
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio() != null ? vehiculo.getAnio().toString() : null);
        vehiculoDescripcion = vehiculoDescripcion.isBlank() ? null : vehiculoDescripcion;

        return ReporteMantenimientoDetalladoDTO.builder()
                .ordenId(orden.getId())
                .codigo(orden.getCodigo())
                .tipo(orden.getTipo())
                .estado(orden.getEstado())
                .vehiculoPlaca(vehiculo.getPlaca())
                .vehiculoDescripcion(vehiculoDescripcion)
                .planNombre(orden.getPlan() != null ? orden.getPlan().getNombre() : null)
                .detalle(orden.getDetalle())
                .responsableNombre(nombreCompleto(orden.getResponsable()))
                .cerradoPorNombre(nombreCompleto(orden.getCerradoPor()))
                .kilometraje(obtenerUltimoKmVehiculo(vehiculo))
                .fechaApertura(orden.getFechaApertura())
                .fechaCierre(orden.getFechaCierre())
                .totalManoObra(orden.getTotalManoObra())
                .totalRepuestos(orden.getTotalRepuestos())
                .subtotal(orden.getSubtotal())
                .ivaValor(orden.getIvaValor())
                .total(orden.getTotal())
                .tareas(tareas)
                .build();
    }

    private ReporteTareaDetalladaDTO tareaToReporteDetallado(Tarea tarea) {
        List<ReporteRepuestoDetalladoDTO> repuestos = tarea.getRepuestos() != null
                ? tarea.getRepuestos().stream()
                .sorted(Comparator.comparing(RepuestoUsado::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::repuestoToReporteDetallado)
                .toList()
                : List.of();

        BigDecimal totalRepuestos = repuestos.stream()
                .map(ReporteRepuestoDetalladoDTO::getCostoTotal)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal manoObra = nvl(tarea.getCostoManoObra());
        BigDecimal totalTarea = manoObra.add(totalRepuestos);

        return ReporteTareaDetalladaDTO.builder()
                .id(tarea.getId())
                .estado(tarea.getEstado())
                .nombre(tarea.getNombre())
                .descripcion(tarea.getDescripcion())
                .asignadoANombre(nombreCompleto(tarea.getAsignadoA()))
                .horas(tarea.getHoras())
                .costoManoObra(manoObra)
                .totalRepuestos(totalRepuestos)
                .totalTarea(totalTarea)
                .repuestos(repuestos)
                .build();
    }

    private ReporteRepuestoDetalladoDTO repuestoToReporteDetallado(RepuestoUsado repuesto) {
        BigDecimal cantidad = nvl(repuesto.getCantidad());
        BigDecimal costoUnitario = nvl(repuesto.getCostoUnitario());
        BigDecimal total = cantidad.multiply(costoUnitario);

        return ReporteRepuestoDetalladoDTO.builder()
                .id(repuesto.getId())
                .descripcion(repuesto.getDescripcion())
                .cantidad(cantidad)
                .costoUnitario(costoUnitario)
                .costoTotal(total)
                .build();
    }

    private void addMetaRow(PdfPTable table, String etiqueta, String valor, Font labelFont, Font valueFont) {
        PdfPCell etiquetaCell = new PdfPCell(new Phrase(etiqueta, labelFont));
        etiquetaCell.setBackgroundColor(new Color(242, 242, 242));
        etiquetaCell.setPadding(4f);
        table.addCell(etiquetaCell);

        PdfPCell valorCell = new PdfPCell(new Phrase(valorOguion(valor), valueFont));
        valorCell.setPadding(4f);
        table.addCell(valorCell);
    }

    private void addHeaderCell(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4f);
        table.addCell(cell);
    }

    private PdfPCell createCell(String valor, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(valorOguion(valor), font));
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setPadding(4f);
        return cell;
    }

    private String concatValores(String... valores) {
        return Arrays.stream(valores)
                .filter(v -> v != null && !v.isBlank())
                .collect(Collectors.joining(" - "));
    }

    private String valorOguion(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private String formatFecha(LocalDateTime fecha) {
        return fecha != null ? DATE_TIME_FORMATTER.format(fecha) : "-";
    }

    private String formatFechaNullable(LocalDateTime fecha) {
        return fecha != null ? DATE_TIME_FORMATTER.format(fecha) : null;
    }

    private String formatMoneda(BigDecimal valor) {
        NumberFormat format = NumberFormat.getCurrencyInstance(LOCALE_ES_EC);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(valor != null ? valor : BigDecimal.ZERO);
    }

    private String formatCantidad(BigDecimal valor) {
        if (valor == null) {
            return "0";
        }
        BigDecimal normalizado = valor.stripTrailingZeros();
        return normalizado.toPlainString();
    }

    private String formatKilometraje(Long valor) {
        return valor != null ? NumberFormat.getNumberInstance(LOCALE_ES_EC).format(valor) + " km" : "No registrado";
    }

    private String nombreCompleto(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        String completo = (nombre + " " + apellido).trim();
        return completo.isEmpty() ? null : completo;
    }

    private Tarea agregarTareaInterno(OrdenMantenimiento om, TareaDTO dto) {
        validarOrdenPermiteAgregarTareas(om);
        Tarea t = new Tarea();
        t.setOrden(om);
        t.setAsignadoA(obtenerUsuarioAsignado(dto.getAsignadoAId()));
        t.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoTarea.PENDIENTE);
        t.setNombre(validarNombreTarea(dto.getNombre(), dto.getDescripcion()));
        t.setDescripcion(dto.getDescripcion());
        t.setHoras(dto.getHoras());
        t.setCostoManoObra(dto.getCostoManoObra());
        t = tareaRepo.save(t);

        if (dto.getRepuestos() != null && !dto.getRepuestos().isEmpty()) {
            List<RepuestoUsado> items = new ArrayList<>();
            for (RepuestoUsadoDTO rDto : dto.getRepuestos()) {
                RepuestoUsado r = new RepuestoUsado();
                r.setTarea(t);
                r.setDescripcion(rDto.getDescripcion());
                r.setCantidad(rDto.getCantidad());
                r.setCostoUnitario(rDto.getCostoUnitario());
                items.add(repuestoRepo.save(r));
            }
            t.setRepuestos(items);
        }
        return t;
    }

    private void recalcularTotales(OrdenMantenimiento om) {
        BigDecimal manoObra = nvl(ordenRepo.getSumaManoObra(om.getId()));
        BigDecimal repuestos = nvl(ordenRepo.getSumaRepuestos(om.getId()));
        BigDecimal subtotal = manoObra.add(repuestos);

        BigDecimal ivaPorc = (om.getIvaPorc() == null || om.getIvaPorc().compareTo(BigDecimal.ZERO) == 0)
                ? configuracionSistemaService.obtenerEntidad().getIvaPredeterminado() : om.getIvaPorc();
        BigDecimal ivaValor = subtotal.multiply(ivaPorc).divide(new BigDecimal("100"));

        om.setTotalManoObra(manoObra);
        om.setTotalRepuestos(repuestos);
        om.setSubtotal(subtotal);
        om.setIvaPorc(ivaPorc);
        om.setIvaValor(ivaValor);
        om.setTotal(subtotal.add(ivaValor));
    }

    private void actualizarPlanDespuesDeOrden(OrdenMantenimiento om) {
        PlanMantenimiento p = om.getPlan();
        boolean mod = false;
        Long ultimoKm = obtenerUltimoKmVehiculo(om.getVehiculo());
        if (p.getFrecuenciaKm() != null && ultimoKm != null) {
            p.setProximoKm(ultimoKm.intValue() + p.getFrecuenciaKm());
            mod = true;
        }
        if (p.getFrecuenciaDias() != null && om.getFechaCierre() != null) {
            p.setProximaFecha(om.getFechaCierre().toLocalDate().plusDays(p.getFrecuenciaDias()));
            mod = true;
        }
        if (mod) planRepo.save(p);
    }

    private void crearAlertaSiguienteCiclo(PlanMantenimiento plan) {
        if (plan == null || !Boolean.TRUE.equals(plan.getActivo()) || plan.getProximaFecha() == null) {
            return;
        }
        var pendientes = alertaRepo.findByPlanIdAndEstado(plan.getId(), EstadoAlerta.PENDIENTE).stream()
                .filter(a -> a.getTipo() == TipoAlerta.FECHA || a.getTipo() == TipoAlerta.CORRECTIVO)
                .toList();
        Alerta alerta = pendientes.isEmpty() ? new Alerta() : pendientes.get(0);
        alerta.setVehiculo(plan.getVehiculo());
        alerta.setPlan(plan);
        alerta.setTipo(plan.getProximaFecha().isBefore(LocalDate.now()) ? TipoAlerta.CORRECTIVO : TipoAlerta.FECHA);
        alerta.setClasificacion(plan.getProximaFecha().isBefore(LocalDate.now()) ? ClasificacionAlerta.VENCIDA : ClasificacionAlerta.PROXIMA);
        alerta.setSeveridad(plan.getProximaFecha().isBefore(LocalDate.now())
                ? com.progra.tesis.fjchanataxi.enums.SeveridadAlerta.ROJO
                : com.progra.tesis.fjchanataxi.enums.SeveridadAlerta.NARANJA);
        alerta.setMensaje("Plan " + plan.getNombre() + " programado para el " + plan.getProximaFecha() + ".");
        alerta.setFechaProgramada(plan.getProximaFecha());
        alerta.setEstado(EstadoAlerta.PENDIENTE);
        alertaRepo.save(alerta);
        if (pendientes.size() > 1) {
            pendientes.subList(1, pendientes.size()).forEach(a -> {
                a.setEstado(EstadoAlerta.CANCELADA);
                alertaRepo.save(a);
            });
        }
    }

    private void atenderAlertasDelPlan(OrdenMantenimiento om) {
        var pendientes = alertaRepo.findByVehiculoIdAndEstadoOrderByFechaProgramadaAsc(
                om.getVehiculo().getId(), EstadoAlerta.PENDIENTE);
        for (Alerta a : pendientes) {
            if (a.getPlan() != null && a.getPlan().getId().equals(om.getPlan().getId())) {
                a.setEstado(EstadoAlerta.ATENDIDA);
                a.setOrdenAtendida(om);
                alertaRepo.save(a);
            }
        }
    }

    private BigDecimal nvl(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }

    private Long obtenerUltimoKmVehiculo(Vehiculo vehiculo) {
        if (vehiculo == null || vehiculo.getId() == null) {
            return null;
        }
        return registroKmRepo.findTopByVehiculoIdOrderByFechaDesc(vehiculo.getId())
                .map(RegistroKilometraje::getOdometro)
                .orElse(vehiculo.getKmActual());
    }

    private String normalizarTexto(String valor) {
        return valor == null || valor.trim().isEmpty() ? null : valor.trim();
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ReglaNegocioException("No se pudo identificar el usuario autenticado");
        }
        return principal.getUsuario();
    }

    private Usuario obtenerUsuarioAsignado(Long usuarioId) {
        if (usuarioId != null) {
            return usuarioRepo.findById(usuarioId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Técnico no existe"));
        }
        return obtenerUsuarioAutenticado();
    }

    private OrdenDTO entityToDTO(OrdenMantenimiento e) {
        return OrdenDTO.builder()
                .id(e.getId()).codigo(e.getCodigo()).tipo(e.getTipo()).estado(e.getEstado())
                .vehiculoId(e.getVehiculo().getId()).vehiculoPlaca(e.getVehiculo().getPlaca())
                .planId(e.getPlan() != null ? e.getPlan().getId() : null)
                .planNombre(e.getPlan() != null ? e.getPlan().getNombre() : null)
                .creadoPorId(e.getCreadoPor() != null ? e.getCreadoPor().getId() : null)
                .creadoPorNombre(e.getCreadoPor() != null ? e.getCreadoPor().getNombre() + " " + e.getCreadoPor().getApellido() : null)
                .responsableId(e.getResponsable() != null ? e.getResponsable().getId() : null)
                .responsableNombre(e.getResponsable() != null ? e.getResponsable().getNombre() + " " + e.getResponsable().getApellido() : null)
                .fechaApertura(e.getFechaApertura()).fechaCierre(e.getFechaCierre())
                .cerradoPorId(e.getCerradoPor() != null ? e.getCerradoPor().getId() : null)
                .cerradoPorNombre(nombreCompleto(e.getCerradoPor()))
                .detalle(e.getDetalle())
                .kilometraje(obtenerUltimoKmVehiculo(e.getVehiculo()))
                .label(construirLabelOrden(e))
                .totalManoObra(e.getTotalManoObra()).totalRepuestos(e.getTotalRepuestos())
                .subtotal(e.getSubtotal()).ivaPorc(e.getIvaPorc()).ivaValor(e.getIvaValor()).total(e.getTotal())
                .tareas(e.getTareas() != null ? e.getTareas().stream().map(this::tareaToDTO).toList() : List.of()).build();
    }

    private TareaDTO tareaToDTO(Tarea t) {
        return TareaDTO.builder()
                .id(t.getId()).ordenId(t.getOrden().getId()).estado(t.getEstado())
                .asignadoAId(t.getAsignadoA() != null ? t.getAsignadoA().getId() : null)
                .asignadoANombre(t.getAsignadoA() != null ? t.getAsignadoA().getNombre() + " " + t.getAsignadoA().getApellido() : null)
                .nombre(t.getNombre())
                .descripcion(t.getDescripcion()).horas(t.getHoras()).costoManoObra(t.getCostoManoObra())
                .repuestos(t.getRepuestos() != null ? t.getRepuestos().stream().map(this::repuestoToDTO).toList() : List.of()).build();
    }

    private RepuestoUsadoDTO repuestoToDTO(RepuestoUsado r) {
        return RepuestoUsadoDTO.builder()
                .id(r.getId())
                .tareaId(r.getTarea() != null ? r.getTarea().getId() : null)
                .tareaNombre(r.getTarea() != null ? r.getTarea().getNombre() : null)
                .descripcion(r.getDescripcion())
                .cantidad(r.getCantidad())
                .costoUnitario(r.getCostoUnitario())
                .build();
    }

    private String validarNombreTarea(String nombre, String descripcion) {
        String valor = nombre;
        if (valor == null || valor.trim().isEmpty()) {
            valor = descripcion;
        }
        if (valor == null || valor.trim().isEmpty()) {
            throw new ReglaNegocioException("El nombre de la tarea es obligatorio");
        }
        valor = valor.trim();
        return valor.length() > 120 ? valor.substring(0, 120) : valor;
    }

    private void validarOrdenPermiteAgregarTareas(OrdenMantenimiento orden) {
        if (orden.getEstado() == EstadoOrden.CERRADA) {
            throw new ReglaNegocioException("No se pueden agregar tareas a una orden cerrada");
        }
        if (orden.getEstado() == EstadoOrden.CANCELADA) {
            throw new ReglaNegocioException("No se pueden agregar tareas a una orden cancelada");
        }
    }

    private int prioridadEstadoSelector(EstadoOrden estado) {
        if (estado == EstadoOrden.ABIERTA || estado == EstadoOrden.EN_PROCESO) {
            return 0;
        }
        if (estado == EstadoOrden.CERRADA) {
            return 1;
        }
        return 2;
    }

    private boolean coincideBusquedaSelector(OrdenMantenimiento orden, String filtro) {
        String texto = String.join(" ",
                valorBusqueda(orden.getCodigo()),
                valorBusqueda(orden.getVehiculo() != null ? orden.getVehiculo().getPlaca() : null),
                valorBusqueda(orden.getTipo() != null ? orden.getTipo().name() : null),
                valorBusqueda(orden.getEstado() != null ? orden.getEstado().name() : null),
                valorBusqueda(orden.getPlan() != null ? orden.getPlan().getNombre() : null),
                valorBusqueda(orden.getDetalle()),
                valorBusqueda(orden.getFechaApertura() != null ? formatFecha(orden.getFechaApertura()) : null),
                valorBusqueda(obtenerUltimoKmVehiculo(orden.getVehiculo())));
        return normalizarBusqueda(texto).contains(filtro);
    }

    private String normalizarBusqueda(Object valor) {
        return valor == null ? "" : String.valueOf(valor).toLowerCase(LOCALE_ES_EC).trim();
    }

    private String valorBusqueda(Object valor) {
        return valor == null ? "" : String.valueOf(valor);
    }

    private String construirLabelOrden(OrdenMantenimiento orden) {
        StringBuilder label = new StringBuilder(valorOguion(orden.getCodigo()));
        Vehiculo vehiculo = orden.getVehiculo();
        if (vehiculo != null && vehiculo.getPlaca() != null) {
            label.append(" | Placa: ").append(vehiculo.getPlaca());
        }
        if (orden.getTipo() != null) {
            label.append(" | ").append(formatearEnum(orden.getTipo().name()));
        }
        if (orden.getPlan() != null && orden.getPlan().getNombre() != null) {
            label.append(" | Plan: ").append(orden.getPlan().getNombre());
        } else if (orden.getDetalle() != null && !orden.getDetalle().isBlank()) {
            label.append(orden.getTipo() == TipoOrden.CORRECTIVA ? " | Falla: " : " | Detalle: ").append(orden.getDetalle());
        }
        if (orden.getEstado() != null) {
            label.append(" | Estado: ").append(formatearEnum(orden.getEstado().name()));
        }
        if (orden.getFechaApertura() != null) {
            label.append(" | Fecha: ").append(formatFecha(orden.getFechaApertura()));
        }
        Long kilometraje = obtenerUltimoKmVehiculo(vehiculo);
        if (kilometraje != null) {
            label.append(" | Km: ").append(NumberFormat.getNumberInstance(LOCALE_ES_EC).format(kilometraje));
        }
        return label.toString();
    }

    private String formatearEnum(String valor) {
        if (valor == null || valor.isBlank()) {
            return "-";
        }
        if ("PREVENTIVA".equals(valor) || "PREVENTIVO".equals(valor)) {
            return "Preventivo";
        }
        if ("CORRECTIVA".equals(valor) || "CORRECTIVO".equals(valor)) {
            return "Correctivo";
        }
        String normalizado = valor.toLowerCase(LOCALE_ES_EC).replace('_', ' ');
        return normalizado.substring(0, 1).toUpperCase(LOCALE_ES_EC) + normalizado.substring(1);
    }
}
