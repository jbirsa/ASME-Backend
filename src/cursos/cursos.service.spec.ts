import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Curso } from './entities/curso.entity';
import { Inscripcion } from './entities/inscripcion.entity';
import { CursosService } from './cursos.service';

describe('CursosService', () => {
  let service: CursosService;
  let cursosRepo: jest.Mocked<
    Pick<
      Repository<Curso>,
      'create' | 'save' | 'find' | 'findOne' | 'preload' | 'remove'
    >
  >;
  let inscripcionesRepo: jest.Mocked<
    Pick<Repository<Inscripcion>, 'findOne' | 'create' | 'save' | 'find'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;

  beforeEach(() => {
    cursosRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    inscripcionesRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
    };

    service = new CursosService(
      cursosRepo as unknown as Repository<Curso>,
      inscripcionesRepo as unknown as Repository<Inscripcion>,
      usersService as UsersService,
    );
  });

  it('throws when enrolling in a nonexistent course', async () => {
    cursosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.enroll('user-1', 10)).rejects.toThrow(
      new NotFoundException('Curso no encontrado'),
    );
  });

  it('throws when enrolling a nonexistent user', async () => {
    cursosRepo.findOne.mockResolvedValue({ cursoId: 10 } as never);
    usersService.findById.mockResolvedValue(null as never);

    await expect(service.enroll('user-1', 10)).rejects.toThrow(
      new NotFoundException('Usuario no encontrado'),
    );
  });

  it('returns alreadyEnrolled when the user is already subscribed', async () => {
    cursosRepo.findOne.mockResolvedValue({ cursoId: 10 } as never);
    usersService.findById.mockResolvedValue({ id: 'user-1' } as never);
    inscripcionesRepo.findOne.mockResolvedValue({
      usuarioId: 'user-1',
      cursoId: 10,
    } as never);

    await expect(service.enroll('user-1', 10)).resolves.toEqual({
      enrolled: true,
      alreadyEnrolled: true,
      cursoId: 10,
    });
    expect(inscripcionesRepo.save).not.toHaveBeenCalled();
  });

  it('creates a new enrollment when none exists', async () => {
    cursosRepo.findOne.mockResolvedValue({ cursoId: 10 } as never);
    usersService.findById.mockResolvedValue({ id: 'user-1' } as never);
    inscripcionesRepo.findOne.mockResolvedValue(null as never);
    inscripcionesRepo.create.mockImplementation((value) => value as never);
    inscripcionesRepo.save.mockResolvedValue({} as never);

    await expect(service.enroll('user-1', 10)).resolves.toEqual({
      enrolled: true,
      alreadyEnrolled: false,
      cursoId: 10,
    });
    expect(inscripcionesRepo.create).toHaveBeenCalledWith({
      usuarioId: 'user-1',
      cursoId: 10,
      estado: 'en_progreso',
    });
  });

  it('maps and sorts my courses by class order', async () => {
    inscripcionesRepo.find.mockResolvedValue([
      {
        estado: 'en_progreso',
        fechaInscripcion: new Date('2026-01-03T00:00:00.000Z'),
        curso: {
          cursoId: 3,
          nombre: 'Curso CAD',
          descripcion: 'Descripcion',
          imagenUrl: 'https://example.com/curso.jpg',
          estado: 'activo',
          clases: [
            { claseId: 20, titulo: 'Clase 2', orden: 2 },
            { claseId: 10, titulo: 'Clase 1', orden: 1 },
            { claseId: 30, titulo: 'Clase sin orden', orden: null },
          ],
        },
      },
      {
        estado: 'en_progreso',
        fechaInscripcion: new Date('2026-01-02T00:00:00.000Z'),
        curso: null,
      },
    ] as never);

    const result = await service.findMyCourses('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].clases.map((clase) => clase.titulo)).toEqual([
      'Clase 1',
      'Clase 2',
      'Clase sin orden',
    ]);
    expect(result[0]).toMatchObject({
      cursoId: 3,
      nombre: 'Curso CAD',
      estado: 'activo',
      inscripcion: { estado: 'en_progreso' },
    });
  });

  it('throws when updating a nonexistent course', async () => {
    cursosRepo.preload.mockResolvedValue(undefined as never);

    await expect(
      service.update(10, { nombre: 'Nuevo nombre' }),
    ).rejects.toThrow(new NotFoundException('Curso no encontrado'));
  });

  it('throws when removing a nonexistent course', async () => {
    cursosRepo.findOne.mockResolvedValue(null as never);

    await expect(service.remove(10)).rejects.toThrow(
      new NotFoundException('Curso no encontrado'),
    );
  });
});
