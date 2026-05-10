import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { PasswordReset } from './entities/password-reset.entity';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let resetsRepo: jest.Mocked<
    Pick<Repository<PasswordReset>, 'create' | 'save' | 'findOne'>
  >;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'changePassword'>
  >;

  beforeEach(() => {
    resetsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    usersService = {
      findByEmail: jest.fn(),
      changePassword: jest.fn(),
    };

    service = new PasswordResetService(
      resetsRepo as unknown as Repository<PasswordReset>,
      usersService as UsersService,
    );
  });

  it('returns a generic success response when the user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null as never);

    await expect(service.createResetToken('missing@asme.org')).resolves.toEqual(
      {
        sent: true,
      },
    );
    expect(resetsRepo.save).not.toHaveBeenCalled();
  });

  it('creates a password reset record and returns the token in dev flow', async () => {
    const user = { id: 'user-1', email: 'alumno@asme.org' };

    usersService.findByEmail.mockResolvedValue(user as never);
    resetsRepo.create.mockImplementation((value) => value as never);
    resetsRepo.save.mockResolvedValue({ id: 1 } as never);

    const result = await service.createResetToken('alumno@asme.org', 30);

    const expectedTokenHash = crypto
      .createHash('sha256')
      .update(result.token)
      .digest('hex');

    expect(result.sent).toBe(true);
    expect(result.token).toEqual(expect.any(String));
    expect(resetsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        tokenHash: expectedTokenHash,
        usedAt: null,
        expiresAt: expect.any(Date),
      }),
    );
    expect(resetsRepo.save).toHaveBeenCalled();
  });

  it('returns ok false when the token does not exist', async () => {
    resetsRepo.findOne.mockResolvedValue(null as never);

    await expect(
      service.consumeResetToken('missing-token', '654321'),
    ).resolves.toEqual({ ok: false });
    expect(usersService.changePassword).not.toHaveBeenCalled();
  });

  it('returns ok false when the token is expired', async () => {
    const token = 'expired-token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    resetsRepo.findOne.mockResolvedValue({
      tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { email: 'alumno@asme.org' },
    } as never);

    await expect(service.consumeResetToken(token, '654321')).resolves.toEqual({
      ok: false,
    });
    expect(usersService.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and marks the token as used when it is valid', async () => {
    const token = 'valid-token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = {
      tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { email: 'alumno@asme.org' },
    };

    resetsRepo.findOne.mockResolvedValue(record as never);
    resetsRepo.save.mockResolvedValue(record as never);
    usersService.changePassword.mockResolvedValue({ updated: true } as never);

    await expect(service.consumeResetToken(token, '654321')).resolves.toEqual({
      ok: true,
    });
    expect(usersService.changePassword).toHaveBeenCalledWith(
      'alumno@asme.org',
      '654321',
    );
    expect(record.usedAt).toEqual(expect.any(Date));
    expect(resetsRepo.save).toHaveBeenCalledWith(record);
  });
});
