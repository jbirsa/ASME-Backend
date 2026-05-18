# ASME Backend

Backend de ASME implementado en NestJS.

El dominio actual del proyecto incluye:

- autenticacion con JWT
- usuarios con roles `admin` y `user`
- cursos
- clases
- inscripciones a cursos
- eventos y patrocinadores

Swagger esta disponible en `/api` cuando la app esta levantada.

## Stack

- NestJS 11
- TypeORM
- PostgreSQL
- Supabase Storage para assets privados
- Swagger
- class-validator
- Jest + Supertest

## Variables de entorno para storage

Para subir fotos y archivos privados de cursos y clases, configura:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=asme-private-assets
SUPABASE_SIGNED_URL_TTL_SECONDS=300
```

Notas:

- usa una bucket privada
- las URLs de acceso se firman desde el backend
- `SUPABASE_SERVICE_ROLE_KEY` no debe exponerse al frontend

## Setup local

Instalar dependencias:

```bash
npm install
```

Levantar la base local con Docker:

```bash
npm run db:up
```

Levantar el backend apuntando a la DB local del repo:

```bash
npm run start:dev:local
```

La DB local del repo usa:

- host: `localhost`
- port: `5433`
- user: `postgres`
- password: `postgres`
- database: `postgres`

## Flujo de migraciones

Este repo usa migraciones TypeORM como mecanismo principal de cambios de esquema.

Regla importante:

- no usar `synchronize` como flujo normal
- si cambias una entidad y eso afecta la DB, tenes que crear una migracion

## Comandos disponibles

Ver migraciones pendientes o aplicadas:

```bash
npm run migration:show
```

Aplicar migraciones usando la configuracion del entorno actual:

```bash
npm run migration:run
```

Revertir la ultima migracion usando la configuracion del entorno actual:

```bash
npm run migration:revert
```

Aplicar migraciones en la DB local Docker del repo:

```bash
npm run migration:run:local
```

Revertir la ultima migracion en la DB local Docker del repo:

```bash
npm run migration:revert:local
```

Crear una migracion vacia manual:

```bash
npm run migration:create
```

## Como crear una migracion cuando cambias una entidad

Paso a paso recomendado:

1. Levanta la DB local.
2. Asegurate de tener la DB al dia con las migraciones existentes.
3. Hace el cambio en la entidad.
4. Genera la migracion comparando entidades contra la DB.
5. Revisa el archivo generado.
6. Corre la migracion en local.
7. Proba el flujo afectado.

Ejemplo real:

```bash
npm run db:up
npm run migration:run:local
```

Luego de cambiar una o mas entidades, genera la migracion con nombre descriptivo:

```bash
USE_LOCAL_DB=true LOCAL_DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres DB_SSL=false npm run typeorm -- migration:generate src/database/migrations/AddCursoCategoria
```

Notas:

- reemplaza `AddCursoCategoria` por un nombre que describa el cambio
- el nombre final del archivo tendra timestamp automaticamente
- genera la migracion contra una DB ya actualizada, no contra una DB vieja

Despues corre la migracion generada:

```bash
npm run migration:run:local
```

## Cuando usar `migration:create` y cuando `migration:generate`

Usa `migration:generate` cuando:

- cambiaste entidades y queres que TypeORM calcule el diff automaticamente

Usa `migration:create` cuando:

- necesitas escribir SQL manualmente
- queres corregir constraints, indices o datos existentes a mano
- el cambio no se deduce bien solo desde las entidades

## Ejemplo de flujo completo

Supongamos que agregas una columna nueva a `Curso`.

1. Editas la entidad.
2. Generas la migracion:

```bash
USE_LOCAL_DB=true LOCAL_DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres DB_SSL=false npm run typeorm -- migration:generate src/database/migrations/AddCursoDuracion
```

3. Revisas el archivo generado en `src/database/migrations/`
4. Aplicás la migracion:

```bash
npm run migration:run:local
```

5. Levantás la app:

```bash
npm run start:dev:local
```

## Buenas practicas para migraciones

- usar nombres descriptivos
- revisar siempre relaciones, `onDelete`, nullability e indices
- no confiar en que cambiar la entidad alcanza
- no editar una migracion ya aplicada en otro entorno
- si una migracion falla, corregirla con una nueva migracion o revertirla y recrearla segun el caso

## Testing

Tests unitarios:

```bash
npm run test
```

Tests e2e:

```bash
npm run test:e2e
```

Notas para e2e:

- usan la DB PostgreSQL local del `docker-compose.yml`
- el script prepara la DB automaticamente, espera a que este disponible y corre migraciones antes de ejecutar Jest
- los tests corren en serie y validan flujos HTTP reales de auth, cursos y clases

## Swagger

Con la app levantada, entra a:

```text
http://localhost:3000/api
```

Los endpoints protegidos requieren `Bearer token`.

Los endpoints `POST` y `PATCH` de `cursos` y `clases` aceptan `multipart/form-data`:

- `cursos`: `foto` opcional y `archivos` opcionales
- `clases`: `archivos` opcionales
- los archivos se almacenan en Supabase Storage y la API responde con signed URLs temporales

## Referencias

- NestJS Docs: `https://docs.nestjs.com/`
- AGENTS del repo: `./AGENTS.md`
