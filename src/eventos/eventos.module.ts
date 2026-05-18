import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { Evento } from './entities/evento.entity';
import { Patrocinador } from './entities/patrocinador.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PatrocinadoresController } from './patrocinadores.controller';
import { PatrocinadoresService } from './patrocinadores.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Evento, Patrocinador]), StorageModule],
  controllers: [EventosController, PatrocinadoresController],
  providers: [EventosService, PatrocinadoresService, RolesGuard],
  exports: [TypeOrmModule],
})
export class EventosModule {}
