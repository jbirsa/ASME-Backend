import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      | 'create'
      | 'findByEmailWithPassword'
      | 'findByIdWithPassword'
      | 'changePassword'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let emailVerificationService: jest.Mocked<
    Pick<EmailVerificationService, 'issueVerificationForUser'>
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByIdWithPassword: jest.fn(),
      changePassword: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    emailVerificationService = {
      issueVerificationForUser: jest.fn(),
    };

    service = new AuthService(
      usersService as UsersService,
      jwtService as JwtService,
      emailVerificationService as EmailVerificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('hashes the password before registering a user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    usersService.create.mockResolvedValue({ id: 'user-1' } as never);
    emailVerificationService.issueVerificationForUser.mockResolvedValue({
      sent: true,
      token: 'verification-token',
    } as never);

    const result = await service.register({
      email: 'alumno@asme.org',
      nombre: 'Juan Perez',
      password: '123456',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'alumno@asme.org',
      nombre: 'Juan Perez',
      password: 'hashed-password',
      emailVerifiedAt: null,
    });
    expect(emailVerificationService.issueVerificationForUser).toHaveBeenCalledWith(
      { id: 'user-1' },
      60 * 24,
    );
    expect(result).toEqual({
      id: 'user-1',
      verificationToken: 'verification-token',
    });
  });

  it('returns the user when credentials are valid', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
      rol: 'user',
      emailVerifiedAt: new Date(),
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const user = await service.validateUser('alumno@asme.org', '123456');

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'alumno@asme.org',
      rol: 'user',
    });
  });

  it('rejects validation when the user does not exist', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null as never);

    await expect(
      service.validateUser('alumno@asme.org', '123456'),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
  });

  it('rejects validation when the password does not match', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
      emailVerifiedAt: new Date(),
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.validateUser('alumno@asme.org', 'wrong-pass'),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
  });

  it('rejects validation when the user has not verified the email', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
      emailVerifiedAt: null,
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.validateUser('alumno@asme.org', '123456'),
    ).rejects.toThrow(
      new ForbiddenException('Debes verificar tu email antes de iniciar sesión'),
    );
  });

  it('signs a JWT with the validated user payload', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      rol: 'admin',
      emailVerifiedAt: new Date(),
    } as never);
    jwtService.signAsync.mockResolvedValue('jwt-token' as never);

    const result = await service.login({
      email: 'alumno@asme.org',
      password: '123456',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'alumno@asme.org',
      rol: 'admin',
    });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('changes the authenticated user password when the current one is valid', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
    } as never);
    usersService.changePassword.mockResolvedValue({ updated: true } as never);
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never);

    const result = await service.changeOwnPassword('user-1', {
      currentPassword: '123456',
      newPassword: '654321',
    });

    expect(usersService.changePassword).toHaveBeenCalledWith(
      'alumno@asme.org',
      '654321',
    );
    expect(result).toEqual({ updated: true });
  });

  it('rejects password change when the current password is incorrect', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.changeOwnPassword('user-1', {
        currentPassword: 'bad-current',
        newPassword: '654321',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Contraseña actual incorrecta'),
    );
  });

  it('rejects password change when the new password matches the current one', async () => {
    usersService.findByIdWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      password: 'hash',
    } as never);
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(true as never);

    await expect(
      service.changeOwnPassword('user-1', {
        currentPassword: '123456',
        newPassword: '123456',
      }),
    ).rejects.toThrow(
      new UnauthorizedException(
        'La nueva contraseña debe ser diferente a la actual',
      ),
    );
  });
});
