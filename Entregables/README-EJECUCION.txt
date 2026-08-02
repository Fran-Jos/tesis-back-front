
ENTREGABLES DEL SISTEMA DE TESIS
Version actualizada: 28/07/2026

Esta version incluye:
- Motor automatico de alertas por kilometraje y fecha.
- Alertas criticas mediante ventana emergente y campana.
- Notificaciones del navegador por dispositivo.
- Alertas personalizadas por usuario y rol.
- Modulo Ajustes exclusivo para administradores.
- Umbrales, destinatarios, intervalo, horizonte e IVA configurables.

1. Backend ejecutable

Archivo:
Tesis_fjchanataxi2025-0.0.1-SNAPSHOT.jar

Como ejecutar:
- Asegurarse de tener Java 17 instalado.
- Asegurarse de tener PostgreSQL iniciado.
- Crear/verificar la base de datos: FinalTESIS
- Usuario de base de datos configurado: postgres
- Contrasena configurada: postgres
- Ejecutar el archivo ejecutar-backend.bat

Comando equivalente:
java -jar Tesis_fjchanataxi2025-0.0.1-SNAPSHOT.jar

URL del backend:
http://localhost:8080/API/v1.0/Mantenimiento

Al iniciar esta version, Hibernate agrega automaticamente las tablas y columnas
necesarias en la base FinalTESIS. No se eliminan los registros existentes.


2. Frontend compilado

Archivo:
frontend-dist.zip

Contenido:
Carpeta dist generada con Vite para produccion. Tambien se deja una copia
descomprimida en frontend-dist para ejecucion local.

Como usar:
- Ejecutar el archivo ejecutar-frontend.bat.
- Abrir en el navegador: http://localhost:4173
- Para publicarlo en un hosting o servidor web, usar el contenido de frontend-dist.zip.

El frontend apunta por defecto al backend en:
http://localhost:8080/API/v1.0/Mantenimiento

El apartado Ajustes solo se muestra al rol ADMIN. Desde alli se configuran:
- Umbrales proximos y criticos en kilometros y dias.
- Evaluacion automatica e intervalo.
- Ventana emergente y notificaciones del navegador.
- Notificaciones del navegador.
- Roles destinatarios.
- Horizonte de alertas.
- IVA predeterminado.

Para una demostracion inmediata, usar el boton:
"Evaluar todos los planes ahora".


2.1 Notificaciones del navegador en computadora y telefono

- El administrador debe mantener activa la opcion "Notificacion del navegador"
  en Ajustes > Comunicaciones.
- Cada usuario debe pulsar "Permitir en este dispositivo" una sola vez.
- El permiso es independiente para cada navegador, computadora o telefono.
- En localhost funciona sin certificado. Para acceder desde otro equipo o telefono
  se requiere publicar el frontend mediante HTTPS; una direccion HTTP de red local
  no es considerada segura por el navegador.
- Esta version muestra notificaciones mientras la aplicacion conserva actividad.
  Para recibirlas con el navegador completamente cerrado se requiere desplegar el
  sistema con HTTPS y configurar Web Push con claves VAPID.

Al iniciar sesion:
- ADMIN recibe todas las alertas pendientes.
- TECNICO y OPERADOR reciben solamente alertas asignadas a su usuario.
- La ventana emergente permite Aceptar o Atender.
- Atender abre la orden vinculada o prepara una nueva para ADMIN/TECNICO.
- Para OPERADOR, Atender abre el historial del vehiculo.


3. Archivos fuente originales

Backend:
Tesis_BACK

Frontend:
Frontend


4. Comandos usados para generar estos entregables

Backend:
cd Tesis_BACK
.\gradlew.bat clean bootJar

Frontend:
cd Frontend
npm.cmd run build


5. Orden recomendado para ejecutar

1. Iniciar PostgreSQL y verificar la base FinalTESIS.
2. Ejecutar ejecutar-backend.bat.
3. Esperar hasta que Spring Boot indique que inicio en el puerto 8080.
4. Ejecutar ejecutar-frontend.bat.
5. Abrir http://localhost:4173.
6. Iniciar sesion con un usuario activo.
