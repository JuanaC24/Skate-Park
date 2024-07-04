# Skate Park Management System

Este proyecto es un sistema de gestión de participantes para un parque de skate. Permite a los administradores aprobar participantes y cambiar su estado, mientras que los participantes pueden registrarse, iniciar sesión y modificar su información.

## Características

- Registro de nuevos participantes.
- Inicio de sesión para participantes y administradores.
- Modificación de datos de perfil para participantes autenticados.
- Visualización de todos los participantes y su estado en la página principal.
- Aprobación de participantes por parte de administradores.
- Eliminación de participantes por parte de administradores.

## Tecnologías Utilizadas

- Node.js
- Express
- Express Handlebars
- JWT (JSON Web Tokens)
- bcrypt.js
- PostgreSQL
- express-fileupload
- Bootstrap
- jQuery
- Socket.io

## Instalación

1. Clona este repositorio.
   ```sh
   git clone <URL_DEL_REPOSITORIO>

2. Navega al directorio del proyecto.

    cd skate-park-management

3. Instala las dependencias.

    npm install

4. Configura las variables de entorno en un archivo .env.

    DB_USER=tu_usuario
    DB_HOST=localhost
    DB_DATABASE=tu_base_de_datos
    DB_PASSWORD=tu_contraseña
    DB_PORT=5432
    SECRET_KEY=tu_clave_secreta

5. Inicia el servidor.

    node app.js

### Uso

1. Navega a http://localhost:3000 para ver la lista de participantes.
2. Regístrate como un nuevo participante.
3. Inicia sesión con un participante registrado.
4. Modifica tus datos de perfil en http://localhost:3000/datos.
5. Inicia sesión como administrador para aprobar o eliminar participantes en http://localhost:3000/admin.

### Estructura del Proyecto

* app.js: Archivo principal del servidor.
* views/: Directorio que contiene las plantillas Handlebars.
    * layouts/: Plantillas de diseño principal.
    * partials/: Plantillas parciales reutilizables.
    * index.handlebars: Página principal que muestra todos los participantes.
    * admin.handlebars: Página de administración para aprobar y eliminar participantes.
* public/: Directorio que contiene archivos estáticos como CSS e imágenes.
    * css/estilos.css: Archivo de estilos personalizado.

### API

 Registro de Participantes
* Endpoint: POST /api/skaters
* Descripción: Registra un nuevo participante.
* Cuerpo de la Solicitud:

{
  "email": "example@example.com",
  "nombre": "Nombre",
  "password": "contraseña",
  "anos_experiencia": 5,
  "especialidad": "Especialidad",
  "estado": "En revisión"
}

### Inicio de Sesión

* Endpoint: POST /api/login
* Descripción: Inicia sesión un participante.
* Cuerpo de la Solicitud:
 
 {
  "email": "example@example.com",
  "password": "contraseña"
}

Obtener Datos del Perfil

* Endpoint: GET /api/protected
* Descripción: Obtiene los datos del perfil del participante autenticado.
* Autenticación: Requiere JWT en el encabezado Authorization.

Actualizar Perfil

* Endpoint: PUT /api/skaters/email/:email
* Descripción: Actualiza los datos del perfil del participante.
* Autenticación: Requiere JWT en el encabezado Authorization.

Eliminar Participante

* Endpoint: DELETE /api/skaters/email/:email
* Descripción: Elimina un participante.
* Autenticación: Requiere JWT en el encabezado Authorization.

Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un problema o enviar una solicitud de extracción.
