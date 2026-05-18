import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailVerification } from './entities/email-verification.entity';

const DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24;

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationsRepo: Repository<EmailVerification>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async issueVerificationForUser(
    user: User,
    ttlMinutes = DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES,
  ) {
    await this.invalidateActiveVerifications(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const entity = this.emailVerificationsRepo.create({
      user,
      tokenHash: this.hashToken(token),
      expiresAt,
      usedAt: null,
    });
    await this.emailVerificationsRepo.save(entity);

    await this.mailService.sendEmailVerificationEmail({
      to: user.email,
      nombre: user.nombre,
      token,
    });

    if (process.env.NODE_ENV !== 'production') {
      return { sent: true, token };
    }

    return { sent: true };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerifiedAt) {
      return { sent: true };
    }

    return this.issueVerificationForUser(
      user,
      this.resolveVerificationTtlMinutes(),
    );
  }

  async consumeVerificationToken(token: string) {
    const record = await this.emailVerificationsRepo.findOne({
      where: {
        tokenHash: this.hashToken(token),
        usedAt: IsNull(),
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    if (!record || record.expiresAt < new Date()) {
      return { ok: false };
    }

    if (!record.user.emailVerifiedAt) {
      await this.usersService.markEmailAsVerified(record.user.id);
    }

    record.usedAt = new Date();
    await this.emailVerificationsRepo.save(record);

    return { ok: true };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private resolveVerificationTtlMinutes() {
    const raw = process.env.EMAIL_VERIFICATION_TTL_MINUTES?.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES;
  }

  private async invalidateActiveVerifications(userId: string) {
    const activeVerifications = await this.emailVerificationsRepo.find({
      where: {
        user: { id: userId },
        usedAt: IsNull(),
      },
    });

    if (!activeVerifications.length) {
      return;
    }

    const invalidatedAt = new Date();
    activeVerifications.forEach((verification) => {
      verification.usedAt = invalidatedAt;
    });

    await this.emailVerificationsRepo.save(activeVerifications);
  }
}
