import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailVerificationService } from './email-verification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      nombre: dto.nombre,
      password: hash,
      emailVerifiedAt: null,
    });

    const verification = await this.emailVerificationService.issueVerificationForUser(
      user,
      this.resolveVerificationTtlMinutes(),
    );

    if (process.env.NODE_ENV !== 'production' && 'token' in verification) {
      return { ...user, verificationToken: verification.token };
    }

    return user; // password excluded by serializer
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.password)
      throw new UnauthorizedException('Credenciales inválidas');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Debes verificar tu email antes de iniciar sesión',
      );
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async changeOwnPassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user || !user.password)
      throw new UnauthorizedException('Usuario no encontrado');
    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) throw new UnauthorizedException('Contraseña actual incorrecta');
    const sameAsCurrent = await bcrypt.compare(dto.newPassword, user.password);
    if (sameAsCurrent)
      throw new UnauthorizedException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    await this.usersService.changePassword(user.email, dto.newPassword);
    return { updated: true };
  }

  private resolveVerificationTtlMinutes() {
    const raw = process.env.EMAIL_VERIFICATION_TTL_MINUTES?.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 24;
  }
}
