import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Clase } from './entities/clase.entity';
import { ClasesService } from './clases.service';
import { Curso } from '../cursos/entities/curso.entity';

describe('ClasesService', () => {
  let service: ClasesService;
  let clasesRepo: jest.Mocked<
    Pick<Repository<Clase>, 'create' | 'save' | 'find' | 'findOne' | 'remove'>
  >;
  let cursosRepo: jest.Mocked<Pick<Repository<Curso>, 'findOne'>>;

  beforeEach(() => {
    clasesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    cursosRepo = {
      findOne: jest.fn(),
    };

    service = new ClasesService(
      clasesRepo as unknown as Repository<Clase>,
      cursosRepo as unknown as Repository<Curso>,
    );
  });

  it('throws when creating a class for a nonexistent course', async () => {
    cursosRepo.findOne.mockResolvedValue(null as never);

    await expect(
      service.create({
        cursoId: 1,
        titulo: 'Clase 1',
        descripcion: 'Desc',
        videoUrl: 'https://www.youtube.com/watch?v=abcd1234',
      }),
    ).rejects.toThrow(new NotFoundException('Curso no encontrado'));
  });

  it('creates a class and defaults the order to null', async () => {
    const curso = { cursoId: 1, nombre: 'Curso CAD' };

    cursosRepo.findOne.mockResolvedValue(curso as never);
    clasesRepo.create.mockImplementation((value) => value as never);
    clasesRepo.save.mockResolvedValue({ claseId: 1 } as never);

    await service.create({
      cursoId: 1,
      titulo: 'Clase 1',
      descripcion: 'Desc',
      videoUrl: 'https://www.youtube.com/watch?v=abcd1234',
    });

    expect(clasesRepo.create).toHaveBeenCalledWith({
      curso,
      titulo: 'Clase 1',
      descripcion: 'Desc',
      videoUrl: 'https://www.youtube.com/watch?v=abcd1234',
      orden: null,
    });
  });

  it('throws when updating a nonexistent class', async () => {
    clasesRepo.findOne.mockResolvedValue(null as never);

    await expect(service.update(1, { titulo: 'Nueva clase' })).rejects.toThrow(
      new NotFoundException('Clase no encontrada'),
    );
  });

  it('throws when updating a class with a nonexistent course', async () => {
    clasesRepo.findOne.mockResolvedValue({ claseId: 1 } as never);
    cursosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.update(1, { cursoId: 5 })).rejects.toThrow(
      new NotFoundException('Curso no encontrado'),
    );
  });

  it('updates class fields and replaces the course when requested', async () => {
    const existing = {
      claseId: 1,
      titulo: 'Viejo titulo',
      descripcion: 'Vieja desc',
      videoUrl: 'https://www.youtube.com/watch?v=old',
      orden: 1,
      curso: { cursoId: 1 },
    };
    const newCurso = { cursoId: 2, nombre: 'Nuevo curso' };

    clasesRepo.findOne.mockResolvedValue(existing as never);
    cursosRepo.findOne.mockResolvedValue(newCurso as never);
    clasesRepo.save.mockImplementation(async (value) => value as never);

    const result = await service.update(1, {
      cursoId: 2,
      titulo: 'Nuevo titulo',
      descripcion: 'Nueva desc',
      videoUrl: 'https://www.youtube.com/watch?v=new',
      orden: 3,
    });

    expect(result).toMatchObject({
      claseId: 1,
      titulo: 'Nuevo titulo',
      descripcion: 'Nueva desc',
      videoUrl: 'https://www.youtube.com/watch?v=new',
      orden: 3,
      curso: newCurso,
    });
  });

  it('throws when removing a nonexistent class', async () => {
    clasesRepo.findOne.mockResolvedValue(null as never);

    await expect(service.remove(1)).rejects.toThrow(
      new NotFoundException('Clase no encontrada'),
    );
  });
});
