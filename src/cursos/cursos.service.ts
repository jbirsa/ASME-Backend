import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { Inscripcion } from './entities/inscripcion.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursosRepo: Repository<Curso>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionesRepo: Repository<Inscripcion>,
    private readonly userService: UsersService,
  ) {}

  async create(dto: CreateCursoDto) {
    const entity = this.cursosRepo.create(dto);
    return this.cursosRepo.save(entity);
  }

  findAll() {
    return this.cursosRepo.find({ relations: { clases: true } });
  }

  async enroll(userId: string, cursoId: number) {
    const curso = await this.cursosRepo.findOne({ where: { cursoId } });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existing = await this.inscripcionesRepo.findOne({
      where: { usuarioId: userId, cursoId },
    });

    if (existing) {
      return {
        enrolled: true,
        alreadyEnrolled: true,
        cursoId,
      };
    }

    const inscripcion = this.inscripcionesRepo.create({
      usuarioId: userId,
      cursoId,
      estado: 'en_progreso',
    });

    await this.inscripcionesRepo.save(inscripcion);

    return {
      enrolled: true,
      alreadyEnrolled: false,
      cursoId,
    };
  }

  async findMyCourses(userId: string) {
    const inscripciones = await this.inscripcionesRepo.find({
      where: { usuarioId: userId },
      relations: { curso: { clases: true } },
      order: { fechaInscripcion: 'DESC' },
    });

    return inscripciones
      .filter((inscripcion) => inscripcion.curso)
      .map((inscripcion) => {
        const clases = [...(inscripcion.curso.clases ?? [])].sort((a, b) => {
          const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
          const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
          if (ordenA !== ordenB) return ordenA - ordenB;
          return a.claseId - b.claseId;
        });

        return {
          cursoId: inscripcion.curso.cursoId,
          nombre: inscripcion.curso.nombre,
          descripcion: inscripcion.curso.descripcion,
          imagenUrl: inscripcion.curso.imagenUrl,
          estado: inscripcion.curso.estado,
          clases,
          inscripcion: {
            estado: inscripcion.estado,
            fechaInscripcion: inscripcion.fechaInscripcion,
          },
        };
      });
  }

  async findOne(id: number) {
    const curso = await this.cursosRepo.findOne({
      where: { cursoId: id },
      relations: { clases: true },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    return curso;
  }

  async update(id: number, dto: UpdateCursoDto) {
    const curso = await this.cursosRepo.preload({ cursoId: id, ...dto });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    return this.cursosRepo.save(curso);
  }

  async remove(id: number) {
    const curso = await this.cursosRepo.findOne({ where: { cursoId: id } });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    await this.cursosRepo.remove(curso);
    return { deleted: true };
  }
}
