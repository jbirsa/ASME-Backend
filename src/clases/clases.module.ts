import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { ClaseArchivo } from './entities/clase-archivo.entity';
import { ClasesController } from './clases.controller';
import { ClasesService } from './clases.service';
import { Clase } from './entities/clase.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { Inscripcion } from '../cursos/entities/inscripcion.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clase, ClaseArchivo, Curso, Inscripcion]),
    StorageModule,
  ],
  controllers: [ClasesController],
  providers: [ClasesService, RolesGuard],
  exports: [TypeOrmModule],
})
export class ClasesModule {}
