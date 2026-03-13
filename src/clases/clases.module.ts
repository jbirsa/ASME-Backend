import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesController } from './clases.controller';
import { ClasesService } from './clases.service';
import { Clase } from './entities/clase.entity';
import { Curso } from '../cursos/entities/curso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clase, Curso])],
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [TypeOrmModule],
})
export class ClasesModule {}

