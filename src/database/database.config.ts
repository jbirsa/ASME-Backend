import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { PasswordReset } from '../auth/entities/password-reset.entity';
import { ClaseArchivo } from '../clases/entities/clase-archivo.entity';
import { Clase } from '../clases/entities/clase.entity';
import { CursoArchivo } from '../cursos/entities/curso-archivo.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { Inscripcion } from '../cursos/entities/inscripcion.entity';
import { Evento } from '../eventos/entities/evento.entity';
import { Patrocinador } from '../eventos/entities/patrocinador.entity';
import { User } from '../users/entities/user.entity';

export const databaseEntities = [
  User,
  PasswordReset,
  Curso,
  CursoArchivo,
  Inscripcion,
  Clase,
  ClaseArchivo,
  Evento,
  Patrocinador,
];

function isEnabled(value: string | undefined, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

type DataSourceConfigOptions = {
  preferDirectUrl?: boolean;
};

function sanitizeDatabaseUrl(raw: string, envVarName: string) {
  const sanitized = raw.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  const url = sanitized.replace(/^postgresql:\/\//i, 'postgres://');

  if (/[\[\]]/.test(url)) {
    throw new Error(
      `${envVarName} contiene corchetes []. Debes reemplazar los placeholders y eliminar los corchetes. Ejemplo: postgres://postgres.<project-ref>:<pass-enc>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    );
  }

  return url;
}

function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv,
  options: DataSourceConfigOptions = {},
) {
  const useLocal = isEnabled(env.USE_LOCAL_DB);

  if (useLocal) {
    return (
      (env.LOCAL_DATABASE_URL && env.LOCAL_DATABASE_URL.trim()) ||
      'postgres://postgres:postgres@localhost:5433/postgres'
    );
  }

  const raw = options.preferDirectUrl ? env.DIRECT_URL || env.DATABASE_URL : env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      options.preferDirectUrl
        ? 'Config DB invalida. Define DIRECT_URL o DATABASE_URL, o usa USE_LOCAL_DB=true para Postgres local.'
        : 'Config DB invalida. Define DATABASE_URL o usa USE_LOCAL_DB=true para Postgres local.',
    );
  }

  const envVarName = options.preferDirectUrl && env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL';
  return sanitizeDatabaseUrl(raw, envVarName);
}

export function getDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
  options: DataSourceConfigOptions = {},
): DataSourceOptions {
  const dbSsl = isEnabled(env.DB_SSL);
  const dbSync = isEnabled(env.DB_SYNC);

  return {
    type: 'postgres',
    url: resolveDatabaseUrl(env, options),
    entities: databaseEntities,
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: dbSync,
    ssl: dbSsl ? { rejectUnauthorized: false } : false,
  };
}

export function getTypeOrmModuleOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  const baseOptions = getDataSourceOptions(env);

  return {
    ...baseOptions,
    autoLoadEntities: true,
    migrationsRun: false,
    retryAttempts: 5,
    retryDelay: 2000,
  };
}
