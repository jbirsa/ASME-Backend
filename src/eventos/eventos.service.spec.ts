import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { EventosService } from './eventos.service';
import { PatrocinadoresService } from './patrocinadores.service';

describe('EventosService', () => {
  let service: EventosService;
  let eventosRepo: jest.Mocked<
    Pick<Repository<Evento>, 'create' | 'save' | 'find' | 'findOne' | 'remove'>
  >;
  let patrocinadoresService: jest.Mocked<
    Pick<PatrocinadoresService, 'findManyByIdsOrFail'>
  >;

  beforeEach(() => {
    eventosRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    patrocinadoresService = {
      findManyByIdsOrFail: jest.fn(),
    };

    service = new EventosService(
      eventosRepo as unknown as Repository<Evento>,
      patrocinadoresService as PatrocinadoresService,
    );
  });

  it('creates an event without sponsor lookup when patrocinadorIds are not provided', async () => {
    const evento = { nombre: 'Feria de Proyectos ASME' };

    eventosRepo.create.mockReturnValue(evento as never);
    eventosRepo.save.mockResolvedValue({ eventoId: 1, ...evento } as never);

    await service.create({
      nombre: 'Feria de Proyectos ASME',
      descripcion: 'Evento institucional',
    });

    expect(patrocinadoresService.findManyByIdsOrFail).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(evento);
  });

  it('resolves patrocinadores when creating an event with patrocinadorIds', async () => {
    const patrocinadores = [{ patrocinadorId: 1, nombre: 'SolidWorks' }];
    const evento = { nombre: 'Feria de Proyectos ASME' };

    eventosRepo.create.mockReturnValue(evento as never);
    patrocinadoresService.findManyByIdsOrFail.mockResolvedValue(
      patrocinadores as never,
    );
    eventosRepo.save.mockResolvedValue({ eventoId: 1, ...evento } as never);

    await service.create({
      nombre: 'Feria de Proyectos ASME',
      patrocinadorIds: [1],
    });

    expect(patrocinadoresService.findManyByIdsOrFail).toHaveBeenCalledWith([1]);
    expect(evento).toMatchObject({ patrocinadores });
  });

  it('throws when fetching a nonexistent event', async () => {
    eventosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.findOne(1)).rejects.toThrow(
      new NotFoundException('Evento no encontrado'),
    );
  });

  it('throws when updating a nonexistent event', async () => {
    eventosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.update(1, { nombre: 'Nuevo nombre' })).rejects.toThrow(
      new NotFoundException('Evento no encontrado'),
    );
  });

  it('updates fields and patrocinadores when patrocinadorIds are provided', async () => {
    const existingEvento = {
      eventoId: 1,
      nombre: 'Viejo nombre',
      tipo: 'virtual',
      fecha: '2026-05-10',
      direccion: 'Old address',
      barrio: 'Old barrio',
      provincia: 'Old provincia',
      descripcion: 'Old desc',
      link: 'https://old.example.com',
      imagenUrl: 'https://old.example.com/image.jpg',
      paginaEvento: 'https://old.example.com/page',
      patrocinadores: [{ patrocinadorId: 1 }],
    };
    const nuevosPatrocinadores = [{ patrocinadorId: 2, nombre: 'AutoDesk' }];

    eventosRepo.findOne.mockResolvedValue(existingEvento as never);
    patrocinadoresService.findManyByIdsOrFail.mockResolvedValue(
      nuevosPatrocinadores as never,
    );
    eventosRepo.save.mockImplementation(async (value) => value as never);

    const result = await service.update(1, {
      nombre: 'Nuevo nombre',
      descripcion: 'Nueva desc',
      patrocinadorIds: [2],
    });

    expect(patrocinadoresService.findManyByIdsOrFail).toHaveBeenCalledWith([2]);
    expect(result).toMatchObject({
      eventoId: 1,
      nombre: 'Nuevo nombre',
      descripcion: 'Nueva desc',
      patrocinadores: nuevosPatrocinadores,
      tipo: 'virtual',
    });
  });

  it('throws when removing a nonexistent event', async () => {
    eventosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.remove(1)).rejects.toThrow(
      new NotFoundException('Evento no encontrado'),
    );
  });
});
