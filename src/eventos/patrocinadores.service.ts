import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Patrocinador } from './entities/patrocinador.entity';
import { CreatePatrocinadorDto } from './dto/create-patrocinador.dto';
import { UpdatePatrocinadorDto } from './dto/update-patrocinador.dto';

@Injectable()
export class PatrocinadoresService {
  constructor(
    @InjectRepository(Patrocinador)
    private readonly patrocinadoresRepo: Repository<Patrocinador>,
  ) {}

  create(dto: CreatePatrocinadorDto) {
    const patrocinador = this.patrocinadoresRepo.create(dto);
    return this.patrocinadoresRepo.save(patrocinador);
  }

  findAll() {
    return this.patrocinadoresRepo.find({
      order: { nombre: 'ASC', patrocinadorId: 'ASC' },
    });
  }

  async findOne(id: number) {
    const patrocinador = await this.patrocinadoresRepo.findOne({
      where: { patrocinadorId: id },
    });
    if (!patrocinador) {
      throw new NotFoundException('Patrocinador no encontrado');
    }
    return patrocinador;
  }

  async update(id: number, dto: UpdatePatrocinadorDto) {
    const patrocinador = await this.patrocinadoresRepo.preload({
      patrocinadorId: id,
      ...dto,
    });
    if (!patrocinador) {
      throw new NotFoundException('Patrocinador no encontrado');
    }
    return this.patrocinadoresRepo.save(patrocinador);
  }

  async remove(id: number) {
    const patrocinador = await this.findOne(id);
    await this.patrocinadoresRepo.remove(patrocinador);
    return { deleted: true };
  }

  async findManyByIdsOrFail(ids: number[]) {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      return [];
    }

    const patrocinadores = await this.patrocinadoresRepo.find({
      where: { patrocinadorId: In(uniqueIds) },
    });

    if (patrocinadores.length !== uniqueIds.length) {
      const foundIds = new Set(
        patrocinadores.map((patrocinador) => patrocinador.patrocinadorId),
      );
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Patrocinadores no encontrados: ${missingIds.join(', ')}`,
      );
    }

    const patrocinadoresById = new Map(
      patrocinadores.map((patrocinador) => [
        patrocinador.patrocinadorId,
        patrocinador,
      ]),
    );

    return uniqueIds.map((id) => patrocinadoresById.get(id)!);
  }
}
