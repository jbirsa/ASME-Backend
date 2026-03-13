import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CursosModule } from './cursos/cursos.module';
import { ClasesModule } from './clases/clases.module';
import { EventosModule } from './eventos/eventos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', cache: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const useLocal = (config.get<string>('USE_LOCAL_DB') || '').toLowerCase() === 'true';
        const sync = (config.get<string>('DB_SYNC') || '').toLowerCase() === 'true';
        const dbSsl = (config.get<string>('DB_SSL') || '').toLowerCase() === 'true';

        let url: string;
        if (useLocal) {
          const localUrl = config.get<string>('LOCAL_DATABASE_URL');
          url = (localUrl && localUrl.trim()) || 'postgres://postgres:postgres@localhost:5432/postgres';
        } else {
          const raw = config.get<string>('DATABASE_URL');
          if (!raw) {
            throw new Error(
              'Config DB inválida. Define DATABASE_URL o usa USE_LOCAL_DB=true para Postgres local.',
            );
          }
          // Limpia comillas y normaliza esquema a postgres:// (algunos parsers fallan con postgresql://)
          const sanitized = raw.trim().replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
          url = sanitized.replace(/^postgresql:\/\//i, 'postgres://');
          if (/[\[\]]/.test(url)) {
            throw new Error(
              'DATABASE_URL contiene corchetes []. Debes reemplazar los placeholders y eliminar los corchetes. Ejemplo: postgres://postgres.<project-ref>:<pass-enc>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
            );
          }
        }
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          synchronize: sync,
          ssl: dbSsl ? { rejectUnauthorized: false } : false,
          retryAttempts: 5,
          retryDelay: 2000,
        };
      },
    }),
    UsersModule,
    AuthModule,
    CursosModule,
    ClasesModule,
    EventosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
