import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { CursoArchivo } from './entities/curso-archivo.entity';
import { Curso } from './entities/curso.entity';
import { Inscripcion } from './entities/inscripcion.entity';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Curso, CursoArchivo, Inscripcion]),
    UsersModule,
    StorageModule,
  ],
  controllers: [CursosController],
  providers: [CursosService, RolesGuard],
  exports: [TypeOrmModule],
})
export class CursosModule {}
