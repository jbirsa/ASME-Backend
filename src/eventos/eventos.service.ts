import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { Patrocinador } from './entities/patrocinador.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventosRepo: Repository<Evento>,
    @InjectRepository(Patrocinador)
    private readonly patrocinadoresRepo: Repository<Patrocinador>,
  ) {}

  async create(dto: CreateEventoDto) {
    const evento = this.eventosRepo.create({
      nombre: dto.nombre,
      tipo: dto.tipo,
      fecha: dto.fecha,
      direccion: dto.direccion,
      barrio: dto.barrio,
      provincia: dto.provincia,
      descripcion: dto.descripcion,
      link: dto.link,
      imagenUrl: dto.imagenUrl,
      paginaEvento: dto.paginaEvento,
    });
    if (dto.patrocinadorIds?.length) {
      evento.patrocinadores = await this.patrocinadoresRepo.find({
        where: { patrocinadorId: In(dto.patrocinadorIds) },
      });
    }
    return this.eventosRepo.save(evento);
  }

  findAll() {
    return this.eventosRepo.find({ relations: { patrocinadores: true } });
  }

  async findOne(id: number) {
    const evento = await this.eventosRepo.findOne({
      where: { eventoId: id },
      relations: { patrocinadores: true },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }

  async update(id: number, dto: UpdateEventoDto) {
    const evento = await this.eventosRepo.findOne({
      where: { eventoId: id },
      relations: { patrocinadores: true },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    Object.assign(evento, {
      nombre: dto.nombre ?? evento.nombre,
      tipo: dto.tipo ?? evento.tipo,
      fecha: dto.fecha ?? evento.fecha,
      direccion: dto.direccion ?? evento.direccion,
      barrio: dto.barrio ?? evento.barrio,
      provincia: dto.provincia ?? evento.provincia,
      descripcion: dto.descripcion ?? evento.descripcion,
      link: dto.link ?? evento.link,
      imagenUrl: dto.imagenUrl ?? evento.imagenUrl,
      paginaEvento: dto.paginaEvento ?? evento.paginaEvento,
    });

    if (dto.patrocinadorIds) {
      evento.patrocinadores = await this.patrocinadoresRepo.find({
        where: { patrocinadorId: In(dto.patrocinadorIds) },
      });
    }
    return this.eventosRepo.save(evento);
  }

  async remove(id: number) {
    const evento = await this.eventosRepo.findOne({ where: { eventoId: id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    await this.eventosRepo.remove(evento);
    return { deleted: true };
  }
}

