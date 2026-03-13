import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from './entities/password-reset.entity';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly resetsRepo: Repository<PasswordReset>,
    private readonly usersService: UsersService,
  ) {}

  async createResetToken(email: string, ttlMinutes = 60) {
    const user = await this.usersService.findByEmail(email);
    // Siempre responderemos como si se hubiera enviado para no filtrar existencia del email
    if (!user) return { sent: true };

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const entity = this.resetsRepo.create({ user, tokenHash, expiresAt, usedAt: null });
    await this.resetsRepo.save(entity);

    // En un sistema real, aquí enviarías el mail con el token o link.
    // Para dev, lo devolvemos para poder probar fácilmente.
    return { sent: true, token };
  }

  async consumeResetToken(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.resetsRepo.findOne({ where: { tokenHash }, relations: { user: true } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { ok: false };
    }

    await this.usersService.changePassword(record.user.email, newPassword);
    record.usedAt = new Date();
    await this.resetsRepo.save(record);
    return { ok: true };
  }
}

