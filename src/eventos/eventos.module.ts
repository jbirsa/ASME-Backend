import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { Evento } from './entities/evento.entity';
import { Patrocinador } from './entities/patrocinador.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Evento, Patrocinador])],
  controllers: [EventosController],
  providers: [EventosService, RolesGuard],
  exports: [TypeOrmModule],
})
export class EventosModule {}
