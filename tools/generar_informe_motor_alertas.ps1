$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$output = Join-Path $workspace "Informe_Motor_Alertas_Personalizadas.docx"
$temp = Join-Path $workspace ".docx_motor_alertas_tmp"
$resolvedWorkspace = [IO.Path]::GetFullPath($workspace)
$resolvedTemp = [IO.Path]::GetFullPath($temp)
if (-not $resolvedTemp.StartsWith($resolvedWorkspace, [StringComparison]::OrdinalIgnoreCase)) {
    throw "La carpeta temporal no pertenece al workspace."
}
if (Test-Path -LiteralPath $resolvedTemp) {
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
}
New-Item -ItemType Directory -Path (Join-Path $resolvedTemp "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $resolvedTemp "word\_rels") | Out-Null

function Escape-Xml([string]$value) {
    return [Security.SecurityElement]::Escape($value)
}

function Paragraph([string]$text, [string]$style = "", [bool]$bold = $false) {
    $styleXml = if ($style) { "<w:pPr><w:pStyle w:val=`"$style`"/></w:pPr>" } else { "" }
    $boldXml = if ($bold) { "<w:rPr><w:b/></w:rPr>" } else { "" }
    $escaped = Escape-Xml $text
    return "<w:p>$styleXml<w:r>$boldXml<w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function Bullet([string]$text) {
    $escaped = Escape-Xml $text
    return "<w:p><w:pPr><w:numPr><w:ilvl w:val=`"0`"/><w:numId w:val=`"1`"/></w:numPr></w:pPr><w:r><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

$body = @()
$body += Paragraph "Informe técnico de mejora" "Title"
$body += Paragraph "Motor automático de alertas, notificación multicanal y configuración administrativa" "Subtitle"
$body += Paragraph "Sistema web de gestión de mantenimiento de transporte pesado"
$body += Paragraph ("Fecha de elaboración: " + (Get-Date -Format "dd/MM/yyyy"))

$body += Paragraph "1. Estado del sistema antes de la mejora" "Heading1"
$body += Paragraph "El sistema ya disponía de vehículos, registros de kilometraje, planes preventivos, órdenes preventivas y correctivas, tareas, repuestos, alertas, historial, reportes PDF, autenticación JWT y control de acceso por roles."
$body += Bullet "El registro de kilometraje validaba que el nuevo odómetro fuera mayor que el último valor conocido."
$body += Bullet "Los planes almacenaban frecuencia en kilómetros, frecuencia en días, próximo kilometraje y próxima fecha."
$body += Bullet "Las órdenes calculaban mano de obra, repuestos, subtotal, IVA y total."
$body += Bullet "Al cerrar una orden se actualizaba el siguiente ciclo del plan."
$body += Bullet "La interfaz mostraba alertas mediante una campana y realizaba consultas periódicas."
$body += Paragraph "Sin embargo, estas reglas estaban distribuidas entre varios servicios del backend y lógica del formulario React. La arquitectura podía percibirse como un conjunto de operaciones CRUD porque no se exponía claramente el proceso transaccional completo."

$body += Paragraph "2. Limitaciones detectadas" "Heading1"
$body += Bullet "Parte de la sincronización de alertas dependía del formulario del frontend, por lo que una segunda petición fallida podía dejar el plan guardado sin la actualización esperada de su alerta."
$body += Bullet "Los umbrales estaban fijados como constantes del código y requerían recompilar para modificarlos."
$body += Bullet "Las alertas por fecha dependían principalmente de consultas o acciones del usuario; no existía un motor central con ejecución periódica configurable."
$body += Bullet "La campana era visible, pero no garantizaba que una alerta crítica llamara inmediatamente la atención."
$body += Bullet "El IVA predeterminado era una constante técnica y no una política operativa administrable."
$body += Bullet "Las credenciales de infraestructura debían separarse de la configuración funcional."

$body += Paragraph "3. Solución implementada" "Heading1"
$body += Paragraph "Se incorporó un motor de alertas centralizado en Spring Boot. El frontend dejó de ser el responsable de decidir cuándo nace o cambia una alerta: ahora solicita operaciones y presenta el resultado calculado por el backend."

$body += Paragraph "3.1 Motor preventivo" "Heading2"
$body += Bullet "Evalúa todos los planes activos de un vehículo al registrar un nuevo kilometraje."
$body += Bullet "Evalúa inmediatamente un plan después de crearlo o modificarlo."
$body += Bullet "Reevalúa el plan después del cierre de una orden y del cálculo de su siguiente ciclo."
$body += Bullet "Ejecuta revisiones periódicas para detectar vencimientos por fecha aunque ningún usuario abra la aplicación."
$body += Bullet "Evita duplicados mediante actualización de la alerta pendiente del mismo vehículo, plan y criterio."
$body += Bullet "Cancela automáticamente una alerta preventiva si el plan queda fuera del umbral o se desactiva."

$body += Paragraph "3.2 Cálculos y clasificación" "Heading2"
$body += Paragraph "Kilómetros restantes = próximo kilometraje del plan − kilometraje actual del vehículo."
$body += Paragraph "Días restantes = próxima fecha del plan − fecha actual."
$body += Bullet "ROJO y VENCIDA: el valor restante es cero o negativo."
$body += Bullet "ROJO y PRÓXIMA: el valor restante es positivo, pero está dentro del umbral crítico."
$body += Bullet "NARANJA y PRÓXIMA: el valor restante está dentro del umbral de advertencia."
$body += Bullet "Sin alerta pendiente: el plan se encuentra fuera de ambos umbrales."

$body += Paragraph "3.3 Transacción del kilometraje" "Heading2"
$body += Paragraph "El registro del kilometraje se marcó como transaccional. En una sola unidad de trabajo se valida el odómetro, se guarda la lectura, se actualiza el vehículo y se evalúan sus planes. Si falla una operación crítica, la transacción se revierte para evitar datos parcialmente sincronizados."

$body += Paragraph "3.4 Comunicación visual" "Heading2"
$body += Bullet "Se conserva la campana global de alertas."
$body += Bullet "Se agregó un modal de atención para alertas rojas o vencidas."
$body += Bullet "Se agregaron notificaciones del navegador por dispositivo mediante permiso explícito y un service worker."
$body += Bullet "El modal muestra vehículo, plan, motivo, fecha y odómetro objetivo."
$body += Bullet "El usuario puede revisar el historial del vehículo o marcar el aviso como visto durante su sesión."
$body += Bullet "El administrador puede habilitar o deshabilitar este comportamiento."

$body += Paragraph "3.5 Notificaciones del navegador e implementación local" "Heading2"
$body += Paragraph "Se implementó un canal adicional de notificación utilizando la Notifications API y un service worker. Cada computadora o teléfono debe conceder permiso de manera individual mediante el botón 'Permitir en este dispositivo'. Cuando el sistema detecta una alerta roja o vencida, muestra una notificación del sistema operativo con la placa y el motivo; al seleccionarla, abre el historial del vehículo relacionado."
$body += Bullet "La implementación actual está preparada para ejecutarse localmente junto con los entregables del proyecto."
$body += Bullet "En http://localhost:4173 las notificaciones y el service worker funcionan porque los navegadores consideran localhost un contexto seguro para desarrollo."
$body += Bullet "Si el sistema se abre desde un teléfono u otra computadora usando una dirección de red como http://192.168.x.x:4173, el navegador puede bloquear el service worker y las notificaciones porque la conexión no utiliza HTTPS."
$body += Bullet "Para una instalación accesible desde diferentes dispositivos se debe publicar el frontend con un certificado HTTPS válido."
$body += Bullet "La versión local genera notificaciones mientras la aplicación conserva actividad y consulta periódicamente las alertas del backend."
$body += Bullet "Para recibir notificaciones con la página o el navegador completamente cerrados se requiere una segunda etapa: Web Push, suscripciones persistentes por dispositivo y claves VAPID."
$body += Bullet "HTTPS protege el token, la suscripción y el contenido enviado entre el dispositivo y el servidor; no es únicamente un requisito visual del navegador."
$body += Paragraph "Alcance declarado para la defensa:" "Heading2"
$body += Paragraph "Dentro del entorno local controlado se implementaron notificaciones del navegador mediante service worker y autorización por dispositivo. El sistema demuestra el flujo de detección y comunicación de alertas. La recepción remota con el navegador completamente cerrado queda condicionada a un despliegue HTTPS y a la configuración de Web Push con VAPID." "" $true

$body += Paragraph "3.6 Ajustes administrativos" "Heading2"
$body += Paragraph "Se creó la ruta Ajustes, visible únicamente para el rol ADMIN. También se protegieron los endpoints con autorización en el backend."
$body += Bullet "Motor preventivo: umbral próximo y crítico en kilómetros; umbral próximo y crítico en días; ejecución automática e intervalo."
$body += Bullet "Comunicaciones: modal crítico y notificaciones del navegador."
$body += Bullet "Las notificaciones del navegador requieren HTTPS fuera de localhost; el permiso se concede por separado en cada dispositivo."
$body += Bullet "Operación: horizonte de alertas y porcentaje de IVA predeterminado."
$body += Bullet "Acción de evaluación inmediata para demostrar el motor sin esperar al proceso programado."
$body += Paragraph "No se incluyeron en Ajustes la clave JWT ni la contraseña de la base de datos. Son secretos de despliegue y deben gestionarse mediante variables de entorno."

$body += Paragraph "4. Recorrido técnico para explicar en la defensa" "Heading1"
$body += Paragraph "Caso demostrativo: una nueva lectura deja al vehículo a 200 km del mantenimiento."
$body += Bullet "1. React envía la lectura y el token JWT a la API REST."
$body += Bullet "2. Spring Security valida identidad y rol."
$body += Bullet "3. RegistroKilometrajeService inicia la transacción."
$body += Bullet "4. Se comprueba que el odómetro sea estrictamente creciente."
$body += Bullet "5. Se guarda la lectura y se actualiza el kilometraje del vehículo."
$body += Bullet "6. MotorAlertasService recupera los planes activos y la configuración."
$body += Bullet "7. Calcula kilómetros y días restantes; 200 km cae dentro del umbral crítico."
$body += Bullet "8. Crea o escala una alerta ROJA sin duplicarla."
$body += Bullet "9. Confirma la transacción y devuelve la respuesta."
$body += Bullet "10. El frontend refresca la campana, presenta el modal y emite el aviso del navegador."

$body += Paragraph "5. Cómo defender la complejidad" "Heading1"
$body += Paragraph "La complejidad no se fundamenta en la cantidad de pantallas, sino en la coordinación consistente de reglas y módulos. Una lectura produce efectos controlados sobre vehículo, planes, alertas, notificaciones e historial dentro de un flujo trazable."
$body += Paragraph "Frase recomendada:" "Heading2"
$body += Paragraph "La solución evolucionó de una interacción centrada en formularios a un sistema transaccional y configurable. Cada lectura de odómetro puede activar reglas preventivas, clasificar riesgos, actualizar alertas sin duplicarlas y comunicar el resultado mediante la campana, el modal y las notificaciones del navegador." "" $true

$body += Paragraph "7. Verificaciones realizadas" "Heading1"
$body += Bullet "Compilación y pruebas del backend con Gradle: exitosas."
$body += Bullet "Análisis ESLint del frontend: exitoso."
$body += Bullet "Compilación de producción del frontend con Vite: exitosa."
$body += Bullet "Persisten como trabajo futuro pruebas automatizadas específicas de integración y concurrencia, además de dividir el paquete JavaScript para reducir su tamaño."

$body += Paragraph "8. Material para elaborar el gráfico: antes y después" "Heading1"
$body += Paragraph "Esta sección proporciona el contenido que debe representarse visualmente en una diapositiva. Se recomienda utilizar dos columnas, 'Antes' y 'Después', unidas por una flecha central titulada 'Evolución mediante ingeniería aplicada'." 

$body += Paragraph "8.1 Antes de la mejora" "Heading2"
$body += Bullet "Origen del proceso: el usuario ingresaba manualmente información desde formularios."
$body += Bullet "Disparador: las alertas se sincronizaban principalmente cuando el usuario guardaba un plan, una orden o un kilometraje."
$body += Bullet "Ubicación de las reglas: parte del proceso se encontraba en el frontend React y otra parte en diferentes servicios del backend."
$body += Bullet "Umbrales: los valores próximos por kilómetros y fechas estaban definidos como constantes dentro del código."
$body += Bullet "Consistencia: guardar la entidad y sincronizar su alerta podían ser solicitudes separadas; una podía funcionar y la otra fallar."
$body += Bullet "Comunicación: la alerta se consultaba desde la campana y las pantallas internas."
$body += Bullet "Navegador: no existía un aviso del sistema operativo."
$body += Bullet "Evaluación temporal: una fecha podía vencer sin generar una acción inmediata si nadie utilizaba el módulo correspondiente."
$body += Bullet "Administración: para modificar un umbral era necesario cambiar código y volver a compilar."

$body += Paragraph "Flujo anterior sugerido para el gráfico" "Heading2"
$body += Paragraph "Usuario → Formulario React → API REST → Guardar entidad → Segunda operación de sincronización → Alerta interna"
$body += Paragraph "Riesgos que deben colocarse debajo del flujo:" "Heading2"
$body += Bullet "Dependencia de la interacción humana."
$body += Bullet "Reglas distribuidas."
$body += Bullet "Posibilidad de sincronización parcial."
$body += Bullet "Sin comunicación multicanal."
$body += Bullet "Parámetros rígidos."

$body += Paragraph "8.2 Después de la mejora" "Heading2"
$body += Bullet "Origen del proceso: una lectura de kilometraje, un cambio de plan, el cierre de una orden o el proceso programado activan el motor."
$body += Bullet "Disparador automático: el backend evalúa reglas aunque el usuario no abra el formulario de alertas."
$body += Bullet "Ubicación de las reglas: MotorAlertasService centraliza la clasificación y sincronización."
$body += Bullet "Umbrales: el administrador configura kilómetros, días, intervalo, canales y destinatarios desde Ajustes."
$body += Bullet "Consistencia: el registro de kilometraje, la actualización del vehículo y la evaluación preventiva forman una transacción."
$body += Bullet "Clasificación: el motor calcula valores restantes y asigna estado próximo o vencido y severidad naranja o roja."
$body += Bullet "Control de duplicados: una alerta pendiente se actualiza o escala en lugar de crear registros repetidos."
$body += Bullet "Comunicación visual multicanal: campana, modal crítico y notificación del navegador."
$body += Bullet "Trazabilidad: la alerta conserva vehículo, plan, tipo, objetivo y orden que la atendió."

$body += Paragraph "Flujo nuevo sugerido para el gráfico" "Heading2"
$body += Paragraph "Evento de negocio → Transacción Spring Boot → Motor de alertas → Cálculo de riesgo → Crear, escalar o cancelar alerta → API REST → Campana + modal + navegador"
$body += Paragraph "Beneficios que deben colocarse debajo del flujo:" "Heading2"
$body += Bullet "Automatización."
$body += Bullet "Consistencia transaccional."
$body += Bullet "Configuración administrativa."
$body += Bullet "Comunicación multicanal."
$body += Bullet "Reintentos y tolerancia a fallos."
$body += Bullet "Mayor trazabilidad."

$body += Paragraph "8.3 Comparación directa para una tabla o infografía" "Heading2"
$body += Paragraph "Aspecto: Activación. Antes: dependía principalmente del formulario. Después: eventos del negocio y tarea programada."
$body += Paragraph "Aspecto: Reglas. Antes: distribuidas entre frontend y backend. Después: centralizadas en MotorAlertasService."
$body += Paragraph "Aspecto: Umbrales. Antes: constantes del código. Después: parámetros persistentes administrables."
$body += Paragraph "Aspecto: Integridad. Antes: operaciones separadas. Después: transacción para lectura, vehículo y evaluación."
$body += Paragraph "Aspecto: Duplicados. Antes: búsqueda y sincronización desde la interfaz. Después: actualización controlada desde el backend."
$body += Paragraph "Aspecto: Canales. Antes: campana interna. Después: campana, modal y notificación del navegador."
$body += Paragraph "Aspecto: Ejecución sin usuario. Antes: limitada. Después: scheduler configurable."
$body += Paragraph "Aspecto: Gobierno. Antes: recompilación. Después: apartado Ajustes exclusivo para ADMIN."

$body += Paragraph "9. Tecnologías empleadas y responsabilidad" "Heading1"
$body += Bullet "React 19 y TypeScript: presentan alertas, modal crítico, permiso del navegador y pantalla de Ajustes."
$body += Bullet "Vite: compila el frontend de producción y copia el service worker al entregable."
$body += Bullet "Notifications API: solicita autorización y muestra la notificación del sistema operativo."
$body += Bullet "Service Worker: recibe la orden de mostrar el aviso y gestiona el clic para abrir el vehículo relacionado."
$body += Bullet "Axios y API REST: comunican el frontend con los endpoints protegidos del backend."
$body += Bullet "Spring Boot y Java 17: ejecutan reglas de negocio, programación automática y canales de comunicación."
$body += Bullet "Spring Security y JWT: validan identidad y restringen Ajustes al rol ADMIN."
$body += Bullet "Spring Data JPA e Hibernate: persisten configuración, planes y alertas en PostgreSQL."
$body += Bullet "Spring Transaction: garantiza que las operaciones críticas se confirmen o reviertan como una unidad."
$body += Bullet "Spring Scheduling: evalúa periódicamente los planes aunque no exista interacción con formularios."
$body += Bullet "PostgreSQL: almacena datos operativos, parámetros administrativos y estados de notificación."
$body += Bullet "Gradle: administra dependencias, pruebas y generación del JAR ejecutable."
$body += Bullet "HTTPS: requisito para utilizar service workers y notificaciones desde equipos remotos de forma segura."
$body += Bullet "Web Push y VAPID: ampliación necesaria para recibir notificaciones con el navegador completamente cerrado; no forma parte del alcance local actual."

$body += Paragraph "10. Guion oral para explicar el antes y el después" "Heading1"
$body += Paragraph "Duración recomendada: entre dos minutos y medio y tres minutos." 

$body += Paragraph "Inicio del guion" "Heading2"
$body += Paragraph "En la primera versión, el sistema ya podía registrar planes, kilometrajes y alertas. Sin embargo, al analizar el proceso identificamos que una parte de la sincronización dependía de las acciones realizadas desde los formularios. Esto significaba que el sistema respondía al ingreso de información, pero todavía no se comportaba como un motor preventivo autónomo."

$body += Paragraph "Explicación del problema anterior" "Heading2"
$body += Paragraph "Los umbrales estaban definidos dentro del código y las reglas se encontraban distribuidas entre el frontend y distintos servicios del backend. Además, guardar una entidad y sincronizar su alerta podían ser operaciones separadas. Si una operación tenía éxito y la siguiente fallaba, existía el riesgo de dejar información parcialmente actualizada. La comunicación se concentraba principalmente en la campana interna."

$body += Paragraph "Explicación de la solución" "Heading2"
$body += Paragraph "Para resolverlo implementé un motor de alertas centralizado en Spring Boot. Este motor se activa al registrar kilometraje, crear o modificar un plan, cerrar una orden y también mediante una tarea programada. Recupera los parámetros configurados por el administrador, calcula kilómetros y días restantes, determina el nivel de riesgo y decide si debe crear, escalar, mantener o cancelar una alerta."

$body += Paragraph "Explicación de la transacción" "Heading2"
$body += Paragraph "Por ejemplo, cuando se registra una lectura, el backend valida que el odómetro sea mayor que el anterior, guarda el registro, actualiza el kilometraje del vehículo y evalúa todos sus planes dentro de una transacción. Si una parte crítica falla, los cambios se revierten. Esto evita estados parciales y demuestra consistencia de datos."

$body += Paragraph "Explicación de la comunicación" "Heading2"
$body += Paragraph "Cuando el riesgo es próximo, el motor genera una alerta naranja; cuando entra en el umbral crítico o vence, genera una alerta roja. El resultado se comunica mediante la campana, un modal y una notificación del navegador autorizada en cada dispositivo."

$body += Paragraph "Explicación de Ajustes" "Heading2"
$body += Paragraph "Los umbrales ya no están fijados en el código. El administrador puede configurar kilómetros, días, intervalo de evaluación, canales visuales, horizonte de consulta e IVA predeterminado. La clave JWT no aparece en Ajustes porque pertenece a la seguridad de infraestructura."

$body += Paragraph "Explicación del alcance local y HTTPS" "Heading2"
$body += Paragraph "La demostración se ejecuta localmente. En localhost, el navegador permite registrar el service worker y mostrar notificaciones porque lo considera un entorno seguro de desarrollo. Para utilizarlo desde un teléfono u otra computadora mediante una red real, debe publicarse con HTTPS. La versión actual avisa mientras la aplicación conserva actividad. La recepción con el navegador completamente cerrado requeriría Web Push y claves VAPID, y se declara como una ampliación de despliegue."

$body += Paragraph "Cierre del guion" "Heading2"
$body += Paragraph "Por lo tanto, la mejora no consistió únicamente en agregar una ventana de aviso. Se transformó un flujo dependiente de formularios en un proceso automático, transaccional, configurable y multicanal. La complejidad se evidencia en la coordinación entre kilometraje, planes, órdenes, alertas, configuración, seguridad y notificaciones, manteniendo consistencia y trazabilidad."

$body += Paragraph "11. Respuestas breves para posibles preguntas del tribunal" "Heading1"
$body += Paragraph "¿Por qué no se dejó la lógica en React? Porque una regla de negocio no debe depender de que el usuario mantenga abierta una pantalla; el backend garantiza ejecución uniforme para todos los clientes."
$body += Paragraph "¿Por qué utilizar una transacción? Para impedir que se guarde el kilometraje sin actualizar el vehículo o sin completar la evaluación asociada."
$body += Paragraph "¿Cómo evita alertas duplicadas? Busca la alerta pendiente del mismo vehículo, plan y criterio; si existe, actualiza su clasificación, severidad y mensaje."
$body += Paragraph "¿Por qué el administrador puede cambiar umbrales? Porque son políticas operativas variables. Las reglas de integridad y los secretos de infraestructura permanecen protegidos en el backend."
$body += Paragraph "¿Por qué se necesita HTTPS en el teléfono? Porque los navegadores solo habilitan service workers y notificaciones persistentes en contextos seguros; localhost es una excepción de desarrollo."
$body += Paragraph "¿La notificación funciona con el navegador cerrado? En el alcance local actual no se garantiza. Para ello se requiere Web Push, una suscripción por dispositivo, claves VAPID y despliegue HTTPS."

$body += Paragraph "12. Comunicación entre clases del backend" "Heading1"
$body += Paragraph "La nueva función se implementó dentro del monolito modular Spring Boot. No constituye un microservicio separado: utiliza las capas Controller, Service, Repository y Model del mismo backend, manteniendo responsabilidades delimitadas."

$body += Paragraph "12.1 Clases principales y responsabilidades" "Heading2"
$body += Bullet "RegistroKilometrajeController: recibe POST /registrokm, valida el formato inicial y delega la operación."
$body += Bullet "RegistroKilometrajeServiceImpl: valida que el odómetro sea creciente, guarda la lectura, actualiza el vehículo e invoca el motor dentro de una transacción."
$body += Bullet "PlanMantenimientoServiceImpl: crea o modifica planes y solicita su evaluación inmediata."
$body += Bullet "OrdenMantenimientoServiceImpl: al cerrar una orden recalcula costos, actualiza el siguiente ciclo del plan, atiende alertas anteriores e invoca nuevamente el motor."
$body += Bullet "MotorAlertasScheduler: ejecuta una revisión periódica según el intervalo definido por el administrador."
$body += Bullet "MotorAlertasController: permite al ADMIN ejecutar manualmente una evaluación total desde Ajustes."
$body += Bullet "MotorAlertasService: contrato que expone las operaciones evaluarVehiculo, evaluarPlan y evaluarTodosLosPlanes."
$body += Bullet "MotorAlertasServiceImpl: implementación que calcula riesgo, clasifica y sincroniza alertas."
$body += Bullet "ConfiguracionSistemaService: entrega los umbrales y parámetros persistentes que gobiernan el cálculo."
$body += Bullet "PlanMantenimientoRepository: obtiene planes activos por vehículo o todos los planes activos."
$body += Bullet "RegistroKilometrajeRepository: recupera la última lectura disponible."
$body += Bullet "AlertaRepository: busca alertas pendientes y persiste su creación, escalamiento o cancelación."
$body += Bullet "Alerta: entidad que conserva vehículo, plan, tipo, clasificación, severidad, mensaje, objetivo y estado."
$body += Bullet "ConfiguracionSistema: entidad administrada únicamente por ADMIN que almacena umbrales, intervalo, canales visuales, horizonte e IVA."

$body += Paragraph "12.2 Métodos del contrato MotorAlertasService" "Heading2"
$body += Paragraph "evaluarVehiculo(Long vehiculoId): recupera todos los planes activos del vehículo y evalúa cada criterio. Se utiliza después de registrar kilometraje."
$body += Paragraph "evaluarPlan(Long planId): recupera un plan concreto y lo evalúa. Se utiliza después de crear, editar o reprogramar un plan."
$body += Paragraph "evaluarTodosLosPlanes(): recupera todos los planes activos, los procesa y devuelve la cantidad evaluada. Se utiliza desde el scheduler y desde el botón administrativo."

$body += Paragraph "12.3 Métodos internos de MotorAlertasServiceImpl" "Heading2"
$body += Paragraph "evaluar(PlanMantenimiento plan): método coordinador. Comprueba si el plan está activo, obtiene configuración y kilometraje actual, y ejecuta las evaluaciones por kilómetros y fecha."
$body += Paragraph "clasificar(long restantes, int crítico, int próximo): aplica los umbrales. Devuelve VENCIDA/ROJO si el valor es cero o negativo, PRÓXIMA/ROJO dentro del umbral crítico, PRÓXIMA/NARANJA dentro del umbral próximo, o null cuando no corresponde emitir alerta."
$body += Paragraph "sincronizar(...): busca una alerta pendiente del mismo vehículo, plan y tipo. Si ya existe, la actualiza; si no existe, crea una; si el riesgo desaparece, la cancela."
$body += Paragraph "cancelarPendientes(PlanMantenimiento plan): cancela alertas que ya no deben permanecer activas cuando el plan se desactiva."
$body += Paragraph "describirKm y describirDias: construyen mensajes comprensibles con la distancia o el tiempo restante."
$body += Paragraph "Resultado: registro interno inmutable que transporta clasificación y severidad desde el cálculo hasta la sincronización."

$body += Paragraph "12.4 Secuencia de comunicación al registrar kilometraje" "Heading2"
$body += Bullet "1. React envía el DTO mediante Axios y agrega Authorization: Bearer JWT."
$body += Bullet "2. JwtAuthenticationFilter valida el token y SecurityFilterChain verifica el rol."
$body += Bullet "3. RegistroKilometrajeController recibe la solicitud y llama a RegistroKilometrajeService.crear."
$body += Bullet "4. RegistroKilometrajeServiceImpl abre la transacción y consulta VehiculoRepository y RegistroKilometrajeRepository."
$body += Bullet "5. Valida el odómetro, guarda RegistroKilometraje y actualiza Vehiculo."
$body += Bullet "6. Llama a MotorAlertasService.evaluarVehiculo."
$body += Bullet "7. MotorAlertasServiceImpl consulta PlanMantenimientoRepository y ConfiguracionSistemaService."
$body += Bullet "8. Calcula kilómetros y días restantes y llama a clasificar."
$body += Bullet "9. Consulta AlertaRepository para determinar si debe crear, escalar, conservar o cancelar."
$body += Bullet "10. La transacción confirma todos los cambios y el Controller devuelve el DTO como JSON."
$body += Bullet "11. AlertsContext consulta las alertas y actualiza campana, modal y notificación del navegador."

$body += Paragraph "12.5 Requisitos de implementación" "Heading2"
$body += Bullet "Java 17 y Spring Boot 3.5."
$body += Bullet "PostgreSQL disponible con las tablas administradas mediante JPA/Hibernate."
$body += Bullet "JWT válido y usuario con uno de los roles autorizados."
$body += Bullet "Plan activo asociado a un vehículo."
$body += Bullet "Próximo kilometraje, próxima fecha o ambos criterios configurados."
$body += Bullet "Umbral crítico menor que el umbral próximo."
$body += Bullet "Evaluación automática habilitada para utilizar el scheduler."
$body += Bullet "Frontend servido desde localhost o HTTPS para utilizar service worker y notificaciones."
$body += Bullet "Permiso de notificaciones concedido individualmente en cada navegador."

$body += Paragraph "12.6 Decisiones de diseño" "Heading2"
$body += Bullet "La regla se encuentra en el backend para no depender de una pantalla React."
$body += Bullet "Se utiliza una interfaz para desacoplar los servicios que invocan el motor de su implementación."
$body += Bullet "La transacción protege la consistencia entre lectura, vehículo y alertas."
$body += Bullet "Los repositorios abstraen las consultas y evitan SQL repetido dentro de los servicios."
$body += Bullet "Los umbrales se persisten porque representan políticas operativas administrables."
$body += Bullet "El IVA se elimina de los formularios de órdenes; únicamente el ADMIN lo modifica desde Ajustes y los servicios lo aplican al recalcular."
$body += Bullet "La alerta se actualiza en lugar de duplicarse para conservar un estado único por plan y criterio."

$body += Paragraph "13. Guion técnico sobre la comunicación de clases" "Heading1"
$body += Paragraph "Cuando el usuario registra una lectura, el Controller no ejecuta la regla de negocio; solamente recibe la solicitud y delega. RegistroKilometrajeServiceImpl inicia una transacción, valida el odómetro mediante los repositorios, guarda la lectura y actualiza el vehículo. Luego se comunica con la interfaz MotorAlertasService mediante evaluarVehiculo."
$body += Paragraph "La implementación MotorAlertasServiceImpl recupera los planes activos desde PlanMantenimientoRepository y los umbrales desde ConfiguracionSistemaService. Para cada plan calcula kilómetros y días restantes. El método clasificar transforma esos valores en clasificación y severidad. Después, sincronizar consulta AlertaRepository y decide si crea una alerta, actualiza la existente o la cancela."
$body += Paragraph "La misma interfaz es reutilizada por PlanMantenimientoServiceImpl, OrdenMantenimientoServiceImpl, MotorAlertasScheduler y MotorAlertasController. De esta manera existen cuatro disparadores diferentes, pero una sola implementación de la regla. Esto evita duplicación y garantiza el mismo resultado independientemente de dónde se origine el evento."
$body += Paragraph "Al finalizar, JPA confirma los cambios en PostgreSQL y la API devuelve JSON. En el frontend, AlertsContext centraliza la consulta y distribuye los datos hacia Topbar, CriticalAlertsModal y BrowserNotifications. Así se completa la comunicación desde el evento de negocio hasta los canales visuales del usuario."

$body += Paragraph "14. Alertas personalizadas al iniciar sesión" "Heading1"
$body += Paragraph "Se incorporó una relación explícita entre Alerta y Usuario mediante el campo asignadaA. Esta relación permite aplicar alcance por identidad y evita mostrar indiscriminadamente información operativa a todos los usuarios."
$body += Bullet "El rol ADMIN consulta todas las alertas pendientes del sistema."
$body += Bullet "Los roles TÉCNICO y OPERADOR consultan únicamente las alertas cuyo usuario asignado coincide con el usuario identificado por el JWT."
$body += Bullet "Las alertas automáticas que todavía no tienen responsable son visibles para el administrador, quien puede asignarlas desde el formulario de alertas."
$body += Bullet "Cuando un usuario no administrador crea una alerta manual, el backend la asigna automáticamente a ese mismo usuario."
$body += Bullet "La regla se ejecuta en el backend; no depende de ocultar información únicamente con React."

$body += Paragraph "14.1 Nuevos campos y métodos" "Heading2"
$body += Paragraph "Alerta.asignadaA: relación ManyToOne opcional hacia Usuario. Se mantiene opcional para que una alerta automática pueda existir antes de que el administrador designe responsable."
$body += Paragraph "AlertaDTO.asignadaAId y asignadaANombre: transportan la identidad asignada hacia y desde el frontend sin exponer la entidad JPA completa."
$body += Paragraph "AlertaRepository.findByAsignadaAIdAndEstadoOrderByFechaProgramadaAsc: recupera solamente alertas pendientes de una persona."
$body += Paragraph "AlertaService.listarParaUsuarioActual: obtiene el usuario desde SecurityContextHolder. Si su rol es ADMIN consulta todas las pendientes; en caso contrario consulta por asignadaA.id."
$body += Paragraph "GET /alertas/mis-alertas: endpoint utilizado por la campana, la lista, el modal y las notificaciones del navegador."
$body += Paragraph "GET /alertas/destinatarios: entrega usuarios activos para que una alerta pueda asignarse desde el formulario."

$body += Paragraph "14.2 Comportamiento visual después del login" "Heading2"
$body += Bullet "AlertsProvider se crea al ingresar al área protegida y consulta inmediatamente /alertas/mis-alertas."
$body += Bullet "CriticalAlertsModal recorre todas las alertas pendientes permitidas para ese usuario, no únicamente las rojas."
$body += Bullet "Aceptar cierra el aviso actual durante la sesión, sin cambiar el estado técnico de la alerta."
$body += Bullet "Atender abre la orden ya vinculada cuando existe."
$body += Bullet "Si no existe orden, para ADMIN o TÉCNICO abre una nueva orden con vehículo, plan, tipo y alerta preseleccionados."
$body += Bullet "Cuando se guarda esa orden, el frontend vincula su identificador con la alerta."
$body += Bullet "Para OPERADOR, Atender abre el historial del vehículo porque su rol no tiene autorización para crear órdenes."
$body += Bullet "BrowserNotifications emite una notificación por cada alerta visible en cada nuevo inicio de sesión, siempre que el dispositivo haya concedido permiso."

$body += Paragraph "14.3 Restricción del navegador" "Heading2"
$body += Paragraph "El sistema no puede concederse permiso de notificaciones por sí mismo. La primera vez, cada navegador exige una acción del usuario mediante 'Permitir en este dispositivo'. Si el permiso ya fue concedido, las notificaciones se emiten automáticamente al iniciar sesión. Si fue rechazado, solo el usuario puede rehabilitarlo desde la configuración del navegador."

$body += Paragraph "15. Guion para explicar la personalización" "Heading1"
$body += Paragraph "Al iniciar sesión, Spring Security valida el JWT y deja al usuario disponible en el contexto de seguridad. El frontend consulta el endpoint mis-alertas. El servicio no confía en un identificador enviado por React, sino que obtiene la identidad directamente del token. Si el rol es administrador devuelve todas las pendientes; para los demás roles ejecuta una consulta filtrada por el usuario asignado."
$body += Paragraph "La respuesta alimenta tres consumidores: la campana, la ventana emergente y las notificaciones del navegador. La ventana presenta una alerta a la vez. Aceptar solo cierra la comunicación visual; Atender conserva el proceso de negocio y conduce a la orden relacionada o prepara una nueva. Con esto se separan tres conceptos: quién puede ver la alerta, cómo se comunica y cómo se atiende."
$body += Paragraph "Esta implementación demuestra autorización basada en identidad, filtrado de datos en el backend, reutilización de un contexto global en React y navegación contextual entre alertas y órdenes."

$bodyXml = $body -join "`n"
$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $bodyXml
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>
  </w:body>
</w:document>
"@

$stylesXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="243B64"/><w:sz w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="4F628E"/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="243B64"/><w:sz w:val="30"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="4F628E"/><w:sz w:val="25"/></w:rPr></w:style>
</w:styles>
'@

$numberingXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>
'@

$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>
'@

$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@

$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>
'@

[IO.File]::WriteAllText((Join-Path $resolvedTemp "[Content_Types].xml"), $contentTypes, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $resolvedTemp "_rels\.rels"), $rels, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $resolvedTemp "word\document.xml"), $documentXml, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $resolvedTemp "word\styles.xml"), $stylesXml, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $resolvedTemp "word\numbering.xml"), $numberingXml, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $resolvedTemp "word\_rels\document.xml.rels"), $docRels, [Text.UTF8Encoding]::new($false))

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Open($output, [IO.FileMode]::CreateNew)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
$parts = @(
    @("[Content_Types].xml", "[Content_Types].xml"),
    @("_rels/.rels", "_rels\.rels"),
    @("word/document.xml", "word\document.xml"),
    @("word/styles.xml", "word\styles.xml"),
    @("word/numbering.xml", "word\numbering.xml"),
    @("word/_rels/document.xml.rels", "word\_rels\document.xml.rels")
)
foreach ($part in $parts) {
    $entry = $archive.CreateEntry($part[0])
    $entryStream = $entry.Open()
    $sourceBytes = [IO.File]::ReadAllBytes((Join-Path $resolvedTemp $part[1]))
    $entryStream.Write($sourceBytes, 0, $sourceBytes.Length)
    $entryStream.Dispose()
}
$archive.Dispose()
$stream.Dispose()
Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
Write-Output $output
