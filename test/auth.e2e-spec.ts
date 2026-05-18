import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  createE2eApp,
  registerAndVerifyUser,
  resetDatabase,
  seedAdmin,
} from './e2e-utils';

describe('Auth flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createE2eApp();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    await seedAdmin(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires email verification before login and then allows password changes', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alumno@asme.org',
        nombre: 'Juan Perez',
        password: '123456',
      })
      .expect(201);

    expect(registerResponse.body.verificationToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({
        token: registerResponse.body.verificationToken,
      })
      .expect(200)
      .expect({ ok: true });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
      .send({
        currentPassword: '123456',
        newPassword: '654321',
      })
      .expect(200)
      .expect({ updated: true });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '654321',
      })
      .expect(200);
  });

  it('lets an admin reset another user password', async () => {
    await registerAndVerifyUser(app);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@asme.org',
        password: 'admin123',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/admin/reset-password')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .send({
        email: 'alumno@asme.org',
        newPassword: '999999',
      })
      .expect(200)
      .expect({ updated: true });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '999999',
      })
      .expect(200);
  });

  it('resets a password with the emailed code flow', async () => {
    await registerAndVerifyUser(app);

    const forgotPasswordResponse = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({
        email: 'alumno@asme.org',
      })
      .expect(200);

    expect(forgotPasswordResponse.body).toMatchObject({
      sent: true,
      code: expect.stringMatching(/^[A-Z]{6}$/),
    });

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        email: 'alumno@asme.org',
        code: forgotPasswordResponse.body.code,
        newPassword: '654321',
      })
      .expect(200)
      .expect({ ok: true });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '654321',
      })
      .expect(200);
  }, 15000);
});
