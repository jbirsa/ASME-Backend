# AGENTS.md

## Lectura Obligatoria

Antes de hacer cualquier tarea en este repositorio:

1. Leer este `AGENTS.md` completo.
2. Revisar la documentacion relevante de NestJS en `https://docs.nestjs.com/` antes de proponer o implementar cambios.
3. Inspeccionar primero el modulo, servicio, controlador, DTO y entidad involucrados.
4. Verificar Swagger en `/api` para entender el contrato actual de la API.

## Proposito Del Repositorio

Este repositorio es el backend de ASME, implementado en NestJS. Representa una plataforma para una organizacion estudiantil.

El foco principal del producto es:

- cursos
- clases
- autenticacion y roles
- eventos

## Dominio Del Negocio

### Estado actual implementado

Hoy el backend implementa principalmente:

- autenticacion con JWT
- registro y login de usuarios
- recuperacion y reseteo de password
- cursos
- clases
- archivos privados para cursos y clases mediante Supabase Storage
- inscripciones a cursos
- eventos
- patrocinadores asociados a eventos

### Dominio objetivo del producto

El dominio objetivo que debe guiar futuras decisiones es:

- cada curso tiene clases
- cada clase tiene como material principal un video de YouTube
- cada clase puede ser evaluada
- los tipos de evaluacion previstos son:
  - multiple choice
  - pregunta a desarrollar
  - entrega de archivo por parte del alumno
- el admin puede:
  - crear cursos
  - crear clases
  - calificar alumnos
  - publicar eventos
  - administrar contenido general

Importante: hoy el subsistema de evaluaciones no esta implementado. No asumir su existencia en tareas futuras.

## Roles

Los nombres tecnicos vigentes en el codigo son:

- `admin`
- `user`

En terminos de negocio, `user` representa al alumno o usuario comun.

Si se habla de "alumno" en discusiones funcionales, mapearlo al rol tecnico actual `user` salvo que se haga una refactorizacion explicita.

## Stack Y Arquitectura

Stack actual detectado en el repo:

- NestJS 11
- TypeORM
- PostgreSQL
- Supabase Storage
- JWT + Passport
- Swagger con `@nestjs/swagger`
- `class-validator` y `class-transformer`

Caracteristicas actuales:

- `ValidationPipe` global
- `ClassSerializerInterceptor` global
- Swagger en `/api`
- configuracion por variables de entorno
- `TypeOrmModule` con `autoLoadEntities`
- migraciones TypeORM como mecanismo principal de cambios de esquema
- base local via `docker-compose.yml`
- signed URLs temporales para assets privados de cursos y clases

## Modulos Actuales

Modulos funcionales hoy registrados en `AppModule`:

- `auth`
- `users`
- `cursos`
- `clases`
- `eventos`

Existe tambien una entidad institucional `Member`, pero no esta integrada como modulo funcional completo.

## Reglas De Trabajo

1. Antes de cambiar logica, entender el modulo completo involucrado.
2. Preferir cambios pequenos y consistentes con el estilo actual del repo.
3. Mantener DTOs, entidades, servicios y controladores alineados.
4. Si se modifica una API, actualizar tambien Swagger.
5. Si cambia el dominio o la arquitectura, actualizar este `AGENTS.md`.
6. No asumir que existe frontend dentro de este repo.
7. Todo cambio de esquema debe resolverse con migraciones TypeORM, no confiando en `synchronize` como flujo principal.

## Migraciones

Este repo usa migraciones TypeORM.

Reglas:

1. `synchronize` debe permanecer desactivado por defecto.
2. Si se cambia una entidad de forma que afecte la DB, crear o actualizar su migracion correspondiente.
3. Revisar explicitamente relaciones, `onDelete`, nullability, indices y nombres de columnas al escribir una migracion.
4. No asumir que una entidad nueva queda aplicada en DB solo por existir en codigo.
5. Para entorno local, correr migraciones antes de probar cambios estructurales.

Comandos utiles:

- `npm run migration:run`
- `npm run migration:revert`
- `npm run migration:show`
- `npm run migration:run:local`

## Convenciones De API

La API actual usa:

- recursos principales en castellano: `cursos`, `clases`, `eventos`
- autenticacion via `Bearer token`
- roles con `@Roles('admin')` y `@Roles('admin', 'user')`
- `multipart/form-data` en create/update de `cursos` y `clases` cuando se suben assets

Al agregar nuevos endpoints:

1. Definir DTOs con validaciones claras.
2. Documentar request y response en Swagger.
3. Incluir ejemplos reales en Swagger para prueba manual.
4. Si el endpoint lleva `path params`, documentarlos con ejemplo.

## Swagger

Swagger es parte obligatoria del flujo de trabajo de este repo.

Reglas:

1. Todo endpoint nuevo o modificado debe quedar bien documentado en `/api`.
2. Todo DTO debe incluir ejemplos con `@ApiProperty({ example: ... })` o `@ApiPropertyOptional({ example: ... })`.
3. Si un endpoint recibe un body sin DTO explicito, documentarlo con `@ApiBody(...)`.
4. Si un endpoint recibe parametros por ruta, documentarlos con `@ApiParam(...)`.
5. Los ejemplos deben ser directamente testeables desde Swagger, sin placeholders ambiguos.

### Criterio para ejemplos

- usar emails realistas del dominio, por ejemplo `alumno@asme.org`
- usar URLs de YouTube para clases
- usar IDs numericos reales para entidades relacionales, por ejemplo `1`
- usar fechas ISO cuando corresponda, por ejemplo `2026-05-20`
- aclarar cuando un token sale de otro flujo, por ejemplo reset password

### Ejemplos de prueba manual en Swagger

#### Auth

`POST /auth/register`

```json
{
  "email": "alumno@asme.org",
  "nombre": "Juan Perez",
  "password": "123456"
}
```

`POST /auth/login`

```json
{
  "email": "alumno@asme.org",
  "password": "123456"
}
```

`POST /auth/forgot-password`

```json
{
  "email": "alumno@asme.org"
}
```

`POST /auth/reset-password`

Nota: en desarrollo, el codigo sale de la respuesta de `forgot-password`.

```json
{
  "email": "alumno@asme.org",
  "code": "QJRMTA",
  "newPassword": "654321"
}
```

`POST /auth/change-password`

Requiere `Bearer token` de `admin` o `user`.

```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

`POST /auth/admin/reset-password`

Requiere `Bearer token` de admin.

```json
{
  "email": "alumno@asme.org",
  "newPassword": "123456"
}
```

#### Cursos

`POST /cursos`

Requiere `Bearer token` de admin.

Usar `multipart/form-data`.

Campos de texto:

- `nombre`: `Introduccion a CAD`
- `descripcion`: `Curso inicial de modelado 3D para estudiantes.`
- `estado`: `activo`
- `imagenUrl`: `https://example.com/cursos/intro-cad.jpg` (opcional, solo si no se sube `foto`)

Archivos:

- `foto`: imagen opcional de portada
- `archivos`: multiples archivos opcionales del curso

`GET /cursos`

Requiere `Bearer token` de `admin` o `user`.

`POST /cursos/:id/inscribirme`

Requiere `Bearer token` de `admin` o `user`.

Ejemplo de `id`: `1`

`GET /cursos/mis-cursos`

Requiere `Bearer token` de `admin` o `user`.

`GET /cursos/:id`

Requiere `Bearer token` de `admin` o `user`.

Ejemplo de `id`: `1`

`PATCH /cursos/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

Usar `multipart/form-data`.

Campos posibles:

- `nombre`: `Introduccion a CAD - Edicion 2026`
- `estado`: `activo`
- `eliminarFoto`: `true`
- `archivoIdsAEliminar`: `[1,2]` como JSON string
- `foto`: nueva imagen opcional
- `archivos`: nuevos archivos opcionales del curso

`DELETE /cursos/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

#### Clases

`POST /clases`

Requiere `Bearer token` de admin.

Usar `multipart/form-data`.

Campos de texto:

- `cursoId`: `1`
- `titulo`: `Clase 1 - Interfaz y primeros pasos`
- `descripcion`: `Recorrido inicial por el entorno de trabajo.`
- `videoUrl`: `https://www.youtube.com/watch?v=abcd1234`
- `orden`: `1`

Archivos:

- `archivos`: multiples archivos opcionales de la clase

`GET /clases`

Requiere `Bearer token` de `admin` o `user`.

`GET /clases/curso/:cursoId`

Requiere `Bearer token` de `admin` o `user`.

Ejemplo de `cursoId`: `1`

`GET /clases/:id`

Requiere `Bearer token` de `admin` o `user`.

Ejemplo de `id`: `1`

`PATCH /clases/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

Usar `multipart/form-data`.

Campos posibles:

- `titulo`: `Clase 1 - Interfaz actualizada`
- `orden`: `2`
- `archivoIdsAEliminar`: `[1,2]` como JSON string
- `archivos`: nuevos archivos opcionales de la clase

`DELETE /clases/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

#### Eventos

`POST /eventos`

Requiere `Bearer token` de admin.

```json
{
  "nombre": "Feria de Proyectos ASME",
  "tipo": "presencial",
  "fecha": "2026-05-20",
  "direccion": "Av. Siempre Viva 123",
  "barrio": "Centro",
  "provincia": "Cordoba",
  "descripcion": "Evento institucional abierto para la comunidad.",
  "link": "https://meet.example.com/asme-feria",
  "imagenUrl": "https://example.com/eventos/feria.jpg",
  "paginaEvento": "https://asme.org/eventos/feria-2026",
  "patrocinadorIds": [1, 2]
}
```

`GET /eventos`

Publico.

`GET /eventos/:id`

Publico.

Ejemplo de `id`: `1`

`PATCH /eventos/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

```json
{
  "nombre": "Feria de Proyectos ASME 2026",
  "descripcion": "Version actualizada del evento.",
  "patrocinadorIds": [1]
}
```

`DELETE /eventos/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

#### Patrocinadores

`POST /patrocinadores`

Requiere `Bearer token` de admin.

```json
{
  "nombre": "SolidWorks",
  "email": "contacto@solidworks.com",
  "link": "https://www.solidworks.com/",
  "imagenUrl": "https://example.com/patrocinadores/solidworks.png"
}
```

`GET /patrocinadores`

Publico.

`GET /patrocinadores/:id`

Publico.

Ejemplo de `id`: `1`

`PATCH /patrocinadores/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

```json
{
  "nombre": "Dassault Systemes",
  "link": "https://www.3ds.com/"
}
```

`DELETE /patrocinadores/:id`

Requiere `Bearer token` de admin.

Ejemplo de `id`: `1`

## Testing

### Backend

En este repo priorizar:

- tests unitarios con Jest
- tests de integracion o e2e HTTP con Jest + Supertest

Si una tarea modifica auth, roles, validaciones, relaciones o flujos entre modulos, considerar agregar o actualizar tests.

Los tests e2e vigentes deben tomarse como referencia funcional basica para auth, cursos, clases e inscripciones.

### Frontend y Playwright

Si existe un repo frontend separado, Playwright debe usarse principalmente ahi para flujos completos de usuario.

Ejemplos de flujos esperables en frontend:

- login
- inscripcion a curso
- acceso a clases
- visualizacion de material
- envio de evaluacion
- carga de archivo
- correccion por admin

### Playwright en este backend

En este repo backend, Playwright no es la herramienta principal. Solo usarlo si hace falta validar flujos HTTP integrados de varios pasos.

Ejemplos posibles de flujo API multi-step:

1. registrar usuario
2. loguear usuario
3. loguear admin
4. crear curso
5. crear clase
6. inscribir usuario
7. consultar `mis-cursos`

## Documentacion Viva

Este archivo debe mantenerse actualizado cuando cambien:

- los modulos activos
- los roles
- el dominio del producto
- la estrategia de testing
- la politica de Swagger
