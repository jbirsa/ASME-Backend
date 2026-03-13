import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './entities/curso.entity';
import { Inscripcion } from './entities/inscripcion.entity';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Curso, Inscripcion])],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [TypeOrmModule],
})
export class CursosModule {}
