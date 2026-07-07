ENTREGABLES DEL SISTEMA DE TESIS

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
