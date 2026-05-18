import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let emailVerificationsRepo: jest.Mocked<
    Pick<Repository<EmailVerification>, 'create' | 'save' | 'findOne' | 'find'>
  >;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'markEmailAsVerified'>
  >;
  let mailService: jest.Mocked<Pick<MailService, 'sendEmailVerificationEmail'>>;

  beforeEach(() => {
    jest.clearAllMocks();

    emailVerificationsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    usersService = {
      findByEmail: jest.fn(),
      markEmailAsVerified: jest.fn(),
    };

    mailService = {
      sendEmailVerificationEmail: jest.fn(),
    };

    service = new EmailVerificationService(
      emailVerificationsRepo as unknown as Repository<EmailVerification>,
      usersService as UsersService,
      mailService as MailService,
    );
  });

  it('returns a generic success response when the user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null as never);

    await expect(
      service.resendVerificationEmail('missing@asme.org'),
    ).resolves.toEqual({ sent: true });
    expect(emailVerificationsRepo.save).not.toHaveBeenCalled();
    expect(mailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns a generic success response when the user is already verified', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alumno@asme.org',
      emailVerifiedAt: new Date(),
    } as never);

    await expect(
      service.resendVerificationEmail('alumno@asme.org'),
    ).resolves.toEqual({ sent: true });
    expect(emailVerificationsRepo.save).not.toHaveBeenCalled();
    expect(mailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('creates an email verification record and returns the token in non-production', async () => {
    const user = {
      id: 'user-1',
      email: 'alumno@asme.org',
      nombre: 'Juan Perez',
    };

    emailVerificationsRepo.find.mockResolvedValue([] as never);
    emailVerificationsRepo.create.mockImplementation((value) => value as never);
    emailVerificationsRepo.save.mockResolvedValue({ id: 1 } as never);

    const result = await service.issueVerificationForUser(user as never, 60);

    expect(result.sent).toBe(true);
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(emailVerificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        tokenHash: expect.any(String),
        usedAt: null,
        expiresAt: expect.any(Date),
      }),
    );
    expect(mailService.sendEmailVerificationEmail).toHaveBeenCalledWith({
      to: 'alumno@asme.org',
      nombre: 'Juan Perez',
      token: result.token,
    });
  });

  it('invalidates previous active verification tokens before creating a new one', async () => {
    const user = {
      id: 'user-1',
      email: 'alumno@asme.org',
      nombre: 'Juan Perez',
    };
    const previousVerification = {
      id: 1,
      usedAt: null,
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
    };

    emailVerificationsRepo.find.mockResolvedValue([previousVerification] as never);
    emailVerificationsRepo.create.mockImplementation((value) => value as never);
    emailVerificationsRepo.save.mockResolvedValue({ id: 2 } as never);

    await service.issueVerificationForUser(user as never);

    expect(previousVerification.usedAt).toEqual(expect.any(Date));
    expect(emailVerificationsRepo.save).toHaveBeenCalledWith([
      previousVerification,
    ]);
  });

  it('returns ok false when no active verification exists for the token', async () => {
    emailVerificationsRepo.findOne.mockResolvedValue(null as never);

    await expect(
      service.consumeVerificationToken('invalid-token'),
    ).resolves.toEqual({ ok: false });
    expect(usersService.markEmailAsVerified).not.toHaveBeenCalled();
  });

  it('returns ok false when the verification token is expired', async () => {
    emailVerificationsRepo.findOne.mockResolvedValue({
      tokenHash: 'hash',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: 'user-1', emailVerifiedAt: null },
    } as never);

    await expect(
      service.consumeVerificationToken('expired-token'),
    ).resolves.toEqual({ ok: false });
    expect(usersService.markEmailAsVerified).not.toHaveBeenCalled();
  });

  it('marks the user as verified and consumes the token when it is valid', async () => {
    const record = {
      tokenHash: 'hash',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', emailVerifiedAt: null },
    };

    emailVerificationsRepo.findOne.mockResolvedValue(record as never);
    emailVerificationsRepo.save.mockResolvedValue(record as never);
    usersService.markEmailAsVerified.mockResolvedValue({
      updated: true,
    } as never);

    await expect(
      service.consumeVerificationToken('valid-token'),
    ).resolves.toEqual({ ok: true });
    expect(usersService.markEmailAsVerified).toHaveBeenCalledWith('user-1');
    expect(record.usedAt).toEqual(expect.any(Date));
    expect(emailVerificationsRepo.save).toHaveBeenCalledWith(record);
  });
});
