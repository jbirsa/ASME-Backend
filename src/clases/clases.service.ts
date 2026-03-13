import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clase } from './entities/clase.entity';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';
import { Curso } from '../cursos/entities/curso.entity';

@Injectable()
export class ClasesService {
  constructor(
    @InjectRepository(Clase)
    private readonly clasesRepo: Repository<Clase>,
    @InjectRepository(Curso)
    private readonly cursosRepo: Repository<Curso>,
  ) {}

  async create(dto: CreateClaseDto) {
    const curso = await this.cursosRepo.findOne({ where: { cursoId: dto.cursoId } });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    const clase = this.clasesRepo.create({
      curso,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      videoUrl: dto.videoUrl,
      orden: dto.orden ?? null,
    });
    return this.clasesRepo.save(clase);
  }

  findAll() {
    return this.clasesRepo.find({ relations: { curso: true } });
  }

  async findOne(id: number) {
    const clase = await this.clasesRepo.findOne({
      where: { claseId: id },
      relations: { curso: true },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada');
    return clase;
  }

  async update(id: number, dto: UpdateClaseDto) {
    const existing = await this.clasesRepo.findOne({ where: { claseId: id } });
    if (!existing) throw new NotFoundException('Clase no encontrada');

    if (dto.cursoId !== undefined) {
      const curso = await this.cursosRepo.findOne({ where: { cursoId: dto.cursoId } });
      if (!curso) throw new NotFoundException('Curso no encontrado');
      existing.curso = curso;
    }

    if (dto.titulo !== undefined) existing.titulo = dto.titulo;
    if (dto.descripcion !== undefined) existing.descripcion = dto.descripcion as any;
    if (dto.videoUrl !== undefined) existing.videoUrl = dto.videoUrl as any;
    if (dto.orden !== undefined) existing.orden = dto.orden as any;

    return this.clasesRepo.save(existing);
  }

  async remove(id: number) {
    const clase = await this.clasesRepo.findOne({ where: { claseId: id } });
    if (!clase) throw new NotFoundException('Clase no encontrada');
    await this.clasesRepo.remove(clase);
    return { deleted: true };
  }

  async findByCurso(cursoId: number) {
    return this.clasesRepo.find({
      where: { curso: { cursoId } },
      order: { orden: 'ASC', claseId: 'ASC' },
    });
  }
}
