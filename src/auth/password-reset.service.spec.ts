import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { PasswordReset } from './entities/password-reset.entity';
import { PasswordResetService } from './password-reset.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let resetsRepo: jest.Mocked<
    Pick<Repository<PasswordReset>, 'create' | 'save' | 'findOne' | 'find'>
  >;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'changePassword'>
  >;
  let mailService: jest.Mocked<Pick<MailService, 'sendPasswordResetEmail'>>;

  beforeEach(() => {
    jest.clearAllMocks();

    resetsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    usersService = {
      findByEmail: jest.fn(),
      changePassword: jest.fn(),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    service = new PasswordResetService(
      resetsRepo as unknown as Repository<PasswordReset>,
      usersService as UsersService,
      mailService as MailService,
    );
  });

  it('returns a generic success response when the user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null as never);

    await expect(service.createResetCode('missing@asme.org')).resolves.toEqual({
      sent: true,
    });
    expect(resetsRepo.save).not.toHaveBeenCalled();
  });

  it('creates a password reset record and returns the code in non-production', async () => {
    const user = { id: 'user-1', email: 'alumno@asme.org' };

    usersService.findByEmail.mockResolvedValue(user as never);
    resetsRepo.find.mockResolvedValue([] as never);
    resetsRepo.create.mockImplementation((value) => value as never);
    resetsRepo.save.mockResolvedValue({ id: 1 } as never);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');

    const result = await service.createResetCode('alumno@asme.org', 30);

    expect(result.sent).toBe(true);
    expect(result.code).toMatch(/^[A-Z]{6}$/);
    expect(resetsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        codeHash: 'hashed-code',
        failedAttempts: 0,
        usedAt: null,
        expiresAt: expect.any(Date),
      }),
    );
    expect(resetsRepo.save).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(result.code, 10);
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'alumno@asme.org',
      code: result.code,
      ttlMinutes: 30,
    });
  });

  it('invalidates previous active reset codes before creating a new one', async () => {
    const user = { id: 'user-1', email: 'alumno@asme.org' };
    const previousReset = {
      id: 1,
      usedAt: null,
      codeHash: 'old-hash',
      failedAttempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    };

    usersService.findByEmail.mockResolvedValue(user as never);
    resetsRepo.find.mockResolvedValue([previousReset] as never);
    resetsRepo.create.mockImplementation((value) => value as never);
    resetsRepo.save.mockResolvedValue({ id: 2 } as never);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');

    await service.createResetCode('alumno@asme.org');

    expect(previousReset.usedAt).toEqual(expect.any(Date));
    expect(resetsRepo.save).toHaveBeenCalledWith([previousReset]);
  });

  it('returns ok false when no active reset exists for the user', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
    } as never);
    resetsRepo.findOne.mockResolvedValue(null as never);

    await expect(
      service.consumeResetCode('alumno@asme.org', 'AAAAAA', '654321'),
    ).resolves.toEqual({ ok: false });
    expect(usersService.changePassword).not.toHaveBeenCalled();
  });

  it('returns ok false when the reset code is expired', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
    } as never);

    resetsRepo.findOne.mockResolvedValue({
      codeHash: 'hash',
      failedAttempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { email: 'alumno@asme.org' },
    } as never);

    await expect(
      service.consumeResetCode('alumno@asme.org', 'AAAAAA', '654321'),
    ).resolves.toEqual({ ok: false });
    expect(usersService.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and marks the code as used when it is valid', async () => {
    const record = {
      codeHash: 'hash',
      failedAttempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { email: 'alumno@asme.org' },
    };

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
    } as never);
    resetsRepo.findOne.mockResolvedValue(record as never);
    resetsRepo.save.mockResolvedValue(record as never);
    usersService.changePassword.mockResolvedValue({ updated: true } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.consumeResetCode('alumno@asme.org', 'QJRMTA', '654321'),
    ).resolves.toEqual({ ok: true });
    expect(usersService.changePassword).toHaveBeenCalledWith(
      'alumno@asme.org',
      '654321',
    );
    expect(record.usedAt).toEqual(expect.any(Date));
    expect(resetsRepo.save).toHaveBeenCalledWith(record);
  });

  it('increments failed attempts and invalidates the code after too many failures', async () => {
    const record = {
      codeHash: 'hash',
      failedAttempts: 4,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { email: 'alumno@asme.org' },
    };

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
    } as never);
    resetsRepo.findOne.mockResolvedValue(record as never);
    resetsRepo.save.mockResolvedValue(record as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.consumeResetCode('alumno@asme.org', 'BADBAD', '654321'),
    ).resolves.toEqual({ ok: false });

    expect(record.failedAttempts).toBe(5);
    expect(record.usedAt).toEqual(expect.any(Date));
    expect(resetsRepo.save).toHaveBeenCalledWith(record);
    expect(usersService.changePassword).not.toHaveBeenCalled();
  });
});
