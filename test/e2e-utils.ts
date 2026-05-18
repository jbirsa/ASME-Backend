import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
import { SupabaseStorageService } from '../src/storage/supabase-storage.service';
import { User } from '../src/users/entities/user.entity';

const TEST_DATABASE_URL =
  'postgres://postgres:postgres@localhost:5433/postgres';

export function applyE2eEnv() {
  process.env.USE_LOCAL_DB = 'true';
  process.env.LOCAL_DATABASE_URL = TEST_DATABASE_URL;
  process.env.DB_SSL = 'false';
  process.env.DB_SYNC = 'false';
  process.env.JWT_SECRET = 'test_secret';
}

class FakeSupabaseStorageService {
  async uploadFile(file: Express.Multer.File, folder: string) {
    return `${folder}/${randomUUID()}-${file.originalname}`;
  }

  async createSignedUrlMap(storagePaths: string[]) {
    return new Map(
      [...new Set(storagePaths.filter(Boolean))].map((storagePath) => [
        storagePath,
        `https://storage.test/${encodeURIComponent(storagePath)}?token=signed`,
      ]),
    );
  }

  async removeFiles() {
    return;
  }
}

export async function createE2eApp(): Promise<INestApplication> {
  applyE2eEnv();

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseStorageService)
    .useValue(new FakeSupabaseStorageService());

  const moduleRef = await moduleBuilder.compile();

  const app = moduleRef.createNestApplication();
  applyAppConfig(app);
  await app.init();

  return app;
}

export async function resetDatabase(dataSource: DataSource) {
  await dataSource.query(`
    TRUNCATE TABLE
      "clase_archivos",
      "curso_archivos",
      "patrocina_a",
      "email_verifications",
      "password_resets",
      "inscripciones",
      "clases",
      "evento",
      "patrocinador",
      "cursos",
      "usuarios"
    RESTART IDENTITY CASCADE
  `);
}

export async function seedAdmin(dataSource: DataSource) {
  const usersRepo = dataSource.getRepository(User);

  const admin = usersRepo.create({
    email: 'admin@asme.org',
    nombre: 'Admin ASME',
    rol: 'admin',
    emailVerifiedAt: new Date(),
    password: await bcrypt.hash('admin123', 10),
  });

  return usersRepo.save(admin);
}

export async function registerAndVerifyUser(
  app: INestApplication,
  user = {
    email: 'alumno@asme.org',
    nombre: 'Juan Perez',
    password: '123456',
  },
) {
  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send(user)
    .expect(201);

  const token = registerResponse.body.verificationToken as string | undefined;
  if (!token) {
    throw new Error('No se recibió verificationToken en entorno de test');
  }

  await request(app.getHttpServer())
    .post('/auth/verify-email')
    .send({ token })
    .expect(200)
    .expect({ ok: true });

  return registerResponse.body;
}
