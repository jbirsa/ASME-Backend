import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { applyAppConfig } from '../src/app.setup';
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

export async function createE2eApp(): Promise<INestApplication> {
  applyE2eEnv();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  applyAppConfig(app);
  await app.init();

  return app;
}

export async function resetDatabase(dataSource: DataSource) {
  await dataSource.query(`
    TRUNCATE TABLE
      "patrocina_a",
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
    password: await bcrypt.hash('admin123', 10),
  });

  return usersRepo.save(admin);
}
