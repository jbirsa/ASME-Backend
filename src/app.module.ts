import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursosModule } from './cursos/cursos.module';
import { ClasesModule } from './clases/clases.module';
import { EventosModule } from './eventos/eventos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { getTypeOrmModuleOptions } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', cache: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getTypeOrmModuleOptions(),
    }),
    UsersModule,
    AuthModule,
    CursosModule,
    ClasesModule,
    EventosModule,
  ],
})
export class AppModule {}
