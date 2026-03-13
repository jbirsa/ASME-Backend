import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesController } from './clases.controller';
import { ClasesService } from './clases.service';
import { Clase } from './entities/clase.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Clase, Curso])],
  controllers: [ClasesController],
  providers: [ClasesService, RolesGuard],
  exports: [TypeOrmModule],
})
export class ClasesModule {}
