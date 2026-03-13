import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(data: { email: string; nombre?: string; password?: string }) {
    const exists = await this.usersRepo.findOne({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email ya registrado');
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string) {
    return this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async changePassword(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const result = await this.usersRepo.update({ email }, { password: hash });
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    return { updated: true };
  }

  async findByIdWithPassword(id: string) {
    return this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id })
      .getOne();
  }

  async changeName(email: string, name: string) {
    const result = await this.usersRepo.update({ email }, { nombre: name });
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    return { updated: true };
  }
}
