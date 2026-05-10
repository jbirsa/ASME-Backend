import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createE2eApp, resetDatabase, seedAdmin } from './e2e-utils';

describe('Cursos flows (e2e)', () => {
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

  it('blocks course creation for non-admin users', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alumno@asme.org',
        nombre: 'Juan Perez',
        password: '123456',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/cursos')
      .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
      .send({
        nombre: 'Introduccion a CAD',
        descripcion: 'Curso inicial de modelado 3D para estudiantes.',
        imagenUrl: 'https://example.com/cursos/intro-cad.jpg',
        estado: 'activo',
      })
      .expect(403);
  });

  it('creates courses and classes as admin, then enrolls a user and returns mis-cursos ordered', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alumno@asme.org',
        nombre: 'Juan Perez',
        password: '123456',
      })
      .expect(201);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@asme.org',
        password: 'admin123',
      })
      .expect(200);

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(200);

    const createCursoResponse = await request(app.getHttpServer())
      .post('/cursos')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .send({
        nombre: 'Introduccion a CAD',
        descripcion: 'Curso inicial de modelado 3D para estudiantes.',
        imagenUrl: 'https://example.com/cursos/intro-cad.jpg',
        estado: 'activo',
      })
      .expect(201);

    const cursoId = createCursoResponse.body.cursoId;

    await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .send({
        cursoId,
        titulo: 'Clase 2 - Operaciones base',
        descripcion: 'Modelado de piezas simples.',
        videoUrl: 'https://www.youtube.com/watch?v=abcd1234',
        orden: 2,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .send({
        cursoId,
        titulo: 'Clase 1 - Interfaz y primeros pasos',
        descripcion: 'Recorrido inicial por el entorno de trabajo.',
        videoUrl: 'https://www.youtube.com/watch?v=wxyz5678',
        orden: 1,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/cursos/${cursoId}/inscribirme`)
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(200)
      .expect({
        enrolled: true,
        alreadyEnrolled: false,
        cursoId,
      });

    const myCoursesResponse = await request(app.getHttpServer())
      .get('/cursos/mis-cursos')
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(200);

    expect(myCoursesResponse.body).toHaveLength(1);
    expect(myCoursesResponse.body[0]).toMatchObject({
      cursoId,
      nombre: 'Introduccion a CAD',
      estado: 'activo',
      inscripcion: {
        estado: 'en_progreso',
      },
    });
    expect(
      myCoursesResponse.body[0].clases.map(
        (clase: { titulo: string }) => clase.titulo,
      ),
    ).toEqual([
      'Clase 1 - Interfaz y primeros pasos',
      'Clase 2 - Operaciones base',
    ]);
  });
});
