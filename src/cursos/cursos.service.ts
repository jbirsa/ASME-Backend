import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursosRepo: Repository<Curso>,
  ) {}

  async create(dto: CreateCursoDto) {
    const entity = this.cursosRepo.create(dto);
    return this.cursosRepo.save(entity);
  }

  findAll() {
    return this.cursosRepo.find({ relations: { clases: true } });
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

