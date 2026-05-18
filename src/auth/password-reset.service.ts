import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { PasswordReset } from './entities/password-reset.entity';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const RESET_CODE_LENGTH = 6;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly resetsRepo: Repository<PasswordReset>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async createResetCode(email: string, ttlMinutes?: number) {
    const user = await this.usersService.findByEmail(email);
    // Siempre responderemos como si se hubiera enviado para no filtrar existencia del email
    if (!user) return { sent: true };

    await this.invalidateActiveResets(user.id);

    const code = this.generateResetCode();
    const codeHash = await bcrypt.hash(code, 10);
    const effectiveTtlMinutes = this.resolveResetTtlMinutes(ttlMinutes);

    const expiresAt = new Date(Date.now() + effectiveTtlMinutes * 60 * 1000);

    const entity = this.resetsRepo.create({
      user,
      codeHash,
      failedAttempts: 0,
      expiresAt,
      usedAt: null,
    });
    await this.resetsRepo.save(entity);

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      code,
      ttlMinutes: effectiveTtlMinutes,
    });

    if (process.env.NODE_ENV !== 'production') {
      return { sent: true, code };
    }

    return { sent: true };
  }

  async consumeResetCode(email: string, code: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { ok: false };
    }

    const record = await this.resetsRepo.findOne({
      where: {
        user: { id: user.id },
        usedAt: IsNull(),
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    if (
      !record ||
      record.expiresAt < new Date() ||
      record.failedAttempts >= MAX_FAILED_ATTEMPTS
    ) {
      return { ok: false };
    }

    const matches = await bcrypt.compare(code, record.codeHash);
    if (!matches) {
      record.failedAttempts += 1;
      if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        record.usedAt = new Date();
      }
      await this.resetsRepo.save(record);
      return { ok: false };
    }

    await this.usersService.changePassword(record.user.email, newPassword);
    record.usedAt = new Date();
    await this.resetsRepo.save(record);
    return { ok: true };
  }

  private resolveResetTtlMinutes(ttlMinutes?: number) {
    if (ttlMinutes && ttlMinutes > 0) {
      return ttlMinutes;
    }

    const raw = process.env.RESET_PASSWORD_TTL_MINUTES?.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  }

  private generateResetCode() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    for (let i = 0; i < RESET_CODE_LENGTH; i += 1) {
      code += alphabet[crypto.randomInt(0, alphabet.length)];
    }

    return code;
  }

  private async invalidateActiveResets(userId: string) {
    const activeResets = await this.resetsRepo.find({
      where: {
        user: { id: userId },
        usedAt: IsNull(),
      },
    });

    if (!activeResets.length) {
      return;
    }

    const invalidatedAt = new Date();
    activeResets.forEach((reset) => {
      reset.usedAt = invalidatedAt;
    });

    await this.resetsRepo.save(activeResets);
  }
}
