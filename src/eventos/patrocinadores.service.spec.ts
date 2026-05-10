import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Patrocinador } from './entities/patrocinador.entity';
import { PatrocinadoresService } from './patrocinadores.service';

describe('PatrocinadoresService', () => {
  let service: PatrocinadoresService;
  let patrocinadoresRepo: jest.Mocked<
    Pick<
      Repository<Patrocinador>,
      'create' | 'save' | 'find' | 'findOne' | 'preload' | 'remove'
    >
  >;

  beforeEach(() => {
    patrocinadoresRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    service = new PatrocinadoresService(
      patrocinadoresRepo as unknown as Repository<Patrocinador>,
    );
  });

  it('throws when fetching a nonexistent patrocinador', async () => {
    patrocinadoresRepo.findOne.mockResolvedValue(null as never);

    await expect(service.findOne(1)).rejects.toThrow(
      new NotFoundException('Patrocinador no encontrado'),
    );
  });

  it('throws when updating a nonexistent patrocinador', async () => {
    patrocinadoresRepo.preload.mockResolvedValue(undefined as never);

    await expect(
      service.update(1, { nombre: 'Nuevo sponsor' }),
    ).rejects.toThrow(new NotFoundException('Patrocinador no encontrado'));
  });

  it('removes an existing patrocinador', async () => {
    const patrocinador = { patrocinadorId: 1, nombre: 'SolidWorks' };

    patrocinadoresRepo.findOne.mockResolvedValue(patrocinador as never);
    patrocinadoresRepo.remove.mockResolvedValue(patrocinador as never);

    await expect(service.remove(1)).resolves.toEqual({ deleted: true });
    expect(patrocinadoresRepo.remove).toHaveBeenCalledWith(patrocinador);
  });

  it('returns an empty array when no patrocinadorIds are provided', async () => {
    await expect(service.findManyByIdsOrFail([])).resolves.toEqual([]);
    expect(patrocinadoresRepo.find).not.toHaveBeenCalled();
  });

  it('returns patrocinadores in the same order as the requested ids', async () => {
    patrocinadoresRepo.find.mockResolvedValue([
      { patrocinadorId: 2, nombre: 'AutoDesk' },
      { patrocinadorId: 1, nombre: 'SolidWorks' },
    ] as never);

    const result = await service.findManyByIdsOrFail([1, 2, 1]);

    expect(result.map((patrocinador) => patrocinador.patrocinadorId)).toEqual([
      1, 2,
    ]);
  });

  it('throws when any patrocinadorId does not exist', async () => {
    patrocinadoresRepo.find.mockResolvedValue([
      { patrocinadorId: 2, nombre: 'AutoDesk' },
    ] as never);

    await expect(service.findManyByIdsOrFail([2, 8])).rejects.toThrow(
      new NotFoundException('Patrocinadores no encontrados: 8'),
    );
  });
});
