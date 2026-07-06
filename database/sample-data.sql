-- Datos de ejemplo para PostgreSQL basados en las entidades del proyecto.
-- Ejecutar en un esquema vacío. Incluye usuarios, vehículos, planes y alertas.

BEGIN;

-- Limpiar tablas principales y reiniciar secuencias.
TRUNCATE TABLE
    repuesto_usado,
    tarea,
    orden_mantenimiento,
    alerta,
    plan_mantenimiento,
    registro_kilometraje,
    vehiculo,
    usuario
RESTART IDENTITY CASCADE;

-- Usuarios de referencia (contraseñas codificadas con BCrypt).
INSERT INTO usuario (
    usu_id,
    usu_nombre,
    usu_apellido,
    usu_cedula,
    usu_celular,
    usu_email,
    usu_password,
    usu_rol,
    usu_estado
) VALUES
    (1, 'Administrador', 'Principal', '1717171717', '0991001000', 'admin@tesis.com', '$2b$12$FmtY.3WxeRpKsQscDenObe/7empy9aY9Kt9.NP.xpnKo4qse8NIH6', 'ADMIN', 'ACTIVO'),
    (2, 'Olivia', 'Campos', '1802457890', '0992002000', 'operador@tesis.com', '$2b$12$F6UcfW8UWNlVuOQfM9TopOf7bqalQAc0okSs56BUgJC5H5GHHFz3.', 'OPERADOR', 'ACTIVO'),
    (3, 'Mateo', 'Reyes', '0914582369', '0993003000', 'tecnico@tesis.com', '$2b$12$PKrKWQOEurVmKjxNME1WZepAWeffNdlhVdSmNTbMloGvwSP0Fc.Dq', 'TECNICO', 'ACTIVO');

-- Vehículos registrados.
INSERT INTO vehiculo (
    vehi_id,
    vehi_placa,
    vehi_marca,
    vehi_modelo,
    vehi_anio,
    vehi_chasis,
    vehi_capacidad_carga,
    vehi_color,
    vehi_km_actual,
    vehi_estado
) VALUES
    (1, 'PCX-1234', 'Toyota', 'Hilux', 2021, 'JT1234HILUX2021', 1.5, 'Blanco', 45200, 'ACTIVO'),
    (2, 'TAX-5678', 'Chevrolet', 'D-Max', 2020, 'CH5678DMAX2020', 1.2, 'Amarillo', 60350, 'ACTIVO'),
    (3, 'LGT-9012', 'Hyundai', 'County', 2019, 'HY9012COUNTY2019', 4.8, 'Azul', 89500, 'ACTIVO');

-- Planes de mantenimiento preventivo.
INSERT INTO plan_mantenimiento (
    pla_id,
    pla_vehiculo_id,
    pla_nombre,
    pla_frecuencia_km,
    pla_frecuencia_dias,
    pla_activo,
    pla_proximo_km,
    pla_proxima_fecha
) VALUES
    (1, 1, 'Plan semestral - Hilux', 10000, 180, TRUE, 50000, DATE '2024-08-15'),
    (2, 2, 'Plan trimestral - D-Max', 8000, 90, TRUE, 64000, DATE '2024-07-30'),
    (3, 3, 'Plan anual - County', 15000, 365, TRUE, 95000, DATE '2024-12-05');

-- Registros de kilometraje recientes.
INSERT INTO registro_kilometraje (
    reg_id,
    reg_vehiculo_id,
    reg_usuario_id,
    reg_fecha,
    reg_odometro
) VALUES
    (1, 1, 2, TIMESTAMP '2024-06-01 08:00:00', 44500),
    (2, 1, 2, TIMESTAMP '2024-07-01 08:15:00', 45200),
    (3, 2, 2, TIMESTAMP '2024-07-03 09:20:00', 60350),
    (4, 3, 1, TIMESTAMP '2024-07-05 10:05:00', 89500);

-- Orden de mantenimiento de ejemplo con tareas y repuestos.
INSERT INTO orden_mantenimiento (
    ord_id,
    ord_codigo,
    ord_tipo,
    ord_estado,
    ord_vehiculo_id,
    ord_plan_id,
    ord_creado_por_id,
    ord_responsable_id,
    ord_fecha_apertura,
    ord_fecha_cierre,
    ord_total_mano_obra,
    ord_total_repuestos,
    ord_subtotal,
    ord_iva_porc,
    ord_iva_valor,
    ord_total
) VALUES
    (1, 'OM-2024-0001', 'PREVENTIVA', 'EN_PROCESO', 1, 1, 1, 3, TIMESTAMP '2024-07-10 09:00:00', NULL,
     120.00, 85.00, 205.00, 12.00, 24.60, 229.60);

INSERT INTO tarea (
    tar_id,
    tar_orden_id,
    tar_estado,
    tar_asignado_a_id,
    tar_descripcion,
    tar_horas,
    tar_costo_mano_obra
) VALUES
    (1, 1, 'PENDIENTE', 3, 'Cambio de aceite y filtros', 2.0, 80.00),
    (2, 1, 'PENDIENTE', 3, 'Revisión de frenos delanteros', 1.5, 40.00);

INSERT INTO repuesto_usado (
    rep_id,
    rep_tarea_id,
    rep_descripcion,
    rep_cantidad,
    rep_costo_unitario
) VALUES
    (1, 1, 'Filtro de aceite Toyota 90915', 1.00, 18.50),
    (2, 1, 'Aceite sintético 5W30 (litro)', 6.00, 8.50),
    (3, 2, 'Pastillas de freno delanteras', 1.00, 40.00);

-- Alertas activas alineadas con los planes anteriores.
INSERT INTO alerta (
    ale_id,
    ale_vehiculo_id,
    ale_plan_id,
    ale_tipo,
    ale_clasificacion,
    ale_mensaje,
    ale_fecha_programada,
    ale_estado,
    ale_creada_por_id,
    ale_orden_atendida_id
) VALUES
    (1, 1, 1, 'PREVENTIVO', 'VENCIDA', 'Cambio de aceite vencido desde el 15/06', DATE '2024-06-15', 'PENDIENTE', 1, NULL),
    (2, 2, 2, 'KILOMETRAJE', 'PROXIMA', 'Inspección de frenos al llegar a 64 000 km', DATE '2024-07-25', 'PENDIENTE', 2, NULL),
    (3, 3, 3, 'FECHA', 'PROXIMA', 'Revisión anual de carrocería', DATE '2024-12-05', 'PENDIENTE', 2, NULL),
    (4, 1, 1, 'PREVENTIVO', 'PROXIMA', 'Rotación de llantas programada', DATE '2024-08-20', 'PENDIENTE', 1, NULL);

-- Asociar alerta 1 con la orden en proceso.
UPDATE alerta SET ale_orden_atendida_id = 1 WHERE ale_id = 1;

-- Ajustar las secuencias al máximo actual.
SELECT setval('usu_seq', COALESCE((SELECT MAX(usu_id) FROM usuario), 0));
SELECT setval('vehi_seq', COALESCE((SELECT MAX(vehi_id) FROM vehiculo), 0));
SELECT setval('plan_seq', COALESCE((SELECT MAX(pla_id) FROM plan_mantenimiento), 0));
SELECT setval('reg_km_seq', COALESCE((SELECT MAX(reg_id) FROM registro_kilometraje), 0));
SELECT setval('ord_seq', COALESCE((SELECT MAX(ord_id) FROM orden_mantenimiento), 0));
SELECT setval('tar_seq', COALESCE((SELECT MAX(tar_id) FROM tarea), 0));
SELECT setval('rep_seq', COALESCE((SELECT MAX(rep_id) FROM repuesto_usado), 0));
SELECT setval('ale_seq', COALESCE((SELECT MAX(ale_id) FROM alerta), 0));

COMMIT;
