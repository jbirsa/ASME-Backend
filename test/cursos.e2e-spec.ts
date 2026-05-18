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

  it('rejects course photos outside jpg png and webp', async () => {
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@asme.org',
        password: 'admin123',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/cursos')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('nombre', 'Introduccion a CAD')
      .attach('foto', Buffer.from('fake gif content'), {
        filename: 'portada-cad.gif',
        contentType: 'image/gif',
      })
      .expect(400);

    expect(response.body.message).toBe(
      'La foto del curso solo admite JPG, PNG o WEBP',
    );
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
      .field('nombre', 'Introduccion a CAD')
      .field('descripcion', 'Curso inicial de modelado 3D para estudiantes.')
      .field('estado', 'activo')
      .attach('foto', Buffer.from('fake image content'), 'portada-cad.png')
      .attach('archivos', Buffer.from('guia del curso'), 'guia-curso.pdf')
      .expect(201);

    expect(createCursoResponse.body.imagenUrl).toContain(
      'https://storage.test/',
    );
    expect(createCursoResponse.body.archivos).toHaveLength(1);
    expect(createCursoResponse.body.archivos[0]).toMatchObject({
      nombreOriginal: 'guia-curso.pdf',
    });

    const cursoId = createCursoResponse.body.cursoId;

    const createSecondClassResponse = await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('cursoId', String(cursoId))
      .field('titulo', 'Clase 2 - Operaciones base')
      .field('descripcion', 'Modelado de piezas simples.')
      .field('videoUrl', 'https://www.youtube.com/watch?v=abcd1234')
      .field('orden', '2')
      .attach(
        'archivos',
        Buffer.from('plantilla clase 2'),
        'plantilla-clase-2.pdf',
      )
      .expect(201);

    expect(createSecondClassResponse.body.archivos).toHaveLength(1);

    const createFirstClassResponse = await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('cursoId', String(cursoId))
      .field('titulo', 'Clase 1 - Interfaz y primeros pasos')
      .field('descripcion', 'Recorrido inicial por el entorno de trabajo.')
      .field('videoUrl', 'https://www.youtube.com/watch?v=wxyz5678')
      .field('orden', '1')
      .attach(
        'archivos',
        Buffer.from('plantilla clase 1'),
        'plantilla-clase-1.pdf',
      )
      .expect(201);

    expect(createFirstClassResponse.body.archivos).toHaveLength(1);

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
      imagenUrl: expect.stringContaining('https://storage.test/'),
      estado: 'activo',
      archivos: [
        {
          nombreOriginal: 'guia-curso.pdf',
          url: expect.stringContaining('https://storage.test/'),
        },
      ],
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
    expect(myCoursesResponse.body[0].clases[0].archivos[0]).toMatchObject({
      nombreOriginal: 'plantilla-clase-1.pdf',
      url: expect.stringContaining('https://storage.test/'),
    });
    expect(myCoursesResponse.body[0].clases[1].archivos[0]).toMatchObject({
      nombreOriginal: 'plantilla-clase-2.pdf',
      url: expect.stringContaining('https://storage.test/'),
    });
  });

  it('exposes private course and class files only to admin or enrolled users', async () => {
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
      .field('nombre', 'Materiales Privados')
      .field('descripcion', 'Curso con archivos protegidos.')
      .attach('archivos', Buffer.from('guia privada'), 'guia-privada.pdf')
      .expect(201);

    const cursoId = createCursoResponse.body.cursoId;

    await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('cursoId', String(cursoId))
      .field('titulo', 'Clase protegida')
      .field('orden', '1')
      .attach('archivos', Buffer.from('apunte privado'), 'apunte-privado.pdf')
      .expect(201);

    const lockedCourseResponse = await request(app.getHttpServer())
      .get(`/cursos/${cursoId}`)
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(200);

    expect(lockedCourseResponse.body.archivos).toEqual([]);
    expect(lockedCourseResponse.body.clases).toEqual([]);

    await request(app.getHttpServer())
      .get(`/clases/curso/${cursoId}`)
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/cursos/${cursoId}/inscribirme`)
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(200);

    const enrolledCourseResponse = await request(app.getHttpServer())
      .get(`/cursos/${cursoId}`)
      .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
      .expect(200);

    expect(enrolledCourseResponse.body.archivos[0]).toMatchObject({
      nombreOriginal: 'guia-privada.pdf',
      url: expect.stringContaining('https://storage.test/'),
    });
    expect(enrolledCourseResponse.body.clases[0].archivos[0]).toMatchObject({
      nombreOriginal: 'apunte-privado.pdf',
      url: expect.stringContaining('https://storage.test/'),
    });
  });

  it('updates course photo/files and class files with multipart requests', async () => {
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@asme.org',
        password: 'admin123',
      })
      .expect(200);

    const createCursoResponse = await request(app.getHttpServer())
      .post('/cursos')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('nombre', 'Termodinamica Aplicada')
      .field('descripcion', 'Curso con materiales privados.')
      .field('estado', 'activo')
      .attach('foto', Buffer.from('foto inicial'), 'foto-inicial.png')
      .attach('archivos', Buffer.from('archivo inicial'), 'guia-inicial.pdf')
      .expect(201);

    const cursoId = createCursoResponse.body.cursoId;
    const cursoArchivoId = createCursoResponse.body.archivos[0].cursoArchivoId;

    const updatedCursoResponse = await request(app.getHttpServer())
      .patch(`/cursos/${cursoId}`)
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('nombre', 'Termodinamica Aplicada 2026')
      .field('archivoIdsAEliminar', JSON.stringify([cursoArchivoId]))
      .attach('foto', Buffer.from('foto nueva'), 'foto-nueva.png')
      .attach('archivos', Buffer.from('archivo nuevo'), 'guia-nueva.pdf')
      .expect(200);

    expect(updatedCursoResponse.body).toMatchObject({
      cursoId,
      nombre: 'Termodinamica Aplicada 2026',
      imagenUrl: expect.stringContaining('https://storage.test/'),
      archivos: [
        {
          nombreOriginal: 'guia-nueva.pdf',
        },
      ],
    });
    expect(updatedCursoResponse.body.archivos).toHaveLength(1);

    const cursoWithoutPhotoResponse = await request(app.getHttpServer())
      .patch(`/cursos/${cursoId}`)
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('eliminarFoto', 'true')
      .expect(200);

    expect(cursoWithoutPhotoResponse.body.imagenUrl).toBeNull();

    const createClaseResponse = await request(app.getHttpServer())
      .post('/clases')
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('cursoId', String(cursoId))
      .field('titulo', 'Clase 1 - Balances de energia')
      .field('descripcion', 'Material inicial.')
      .field('videoUrl', 'https://www.youtube.com/watch?v=abcd1234')
      .field('orden', '1')
      .attach(
        'archivos',
        Buffer.from('archivo clase inicial'),
        'apunte-inicial.pdf',
      )
      .expect(201);

    const claseId = createClaseResponse.body.claseId;
    const claseArchivoId = createClaseResponse.body.archivos[0].claseArchivoId;

    const updatedClaseResponse = await request(app.getHttpServer())
      .patch(`/clases/${claseId}`)
      .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
      .field('titulo', 'Clase 1 - Balances de energia actualizada')
      .field('archivoIdsAEliminar', JSON.stringify([claseArchivoId]))
      .attach(
        'archivos',
        Buffer.from('archivo clase nuevo'),
        'apunte-actualizado.pdf',
      )
      .expect(200);

    expect(updatedClaseResponse.body).toMatchObject({
      claseId,
      titulo: 'Clase 1 - Balances de energia actualizada',
      archivos: [
        {
          nombreOriginal: 'apunte-actualizado.pdf',
          url: expect.stringContaining('https://storage.test/'),
        },
      ],
    });
    expect(updatedClaseResponse.body.archivos).toHaveLength(1);
  });
});
