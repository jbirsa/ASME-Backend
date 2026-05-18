import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  createE2eApp,
  registerAndVerifyUser,
  resetDatabase,
  seedAdmin,
} from './e2e-utils';

describe('Eventos y patrocinadores flows (e2e)', () => {
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

  async function loginAsAdmin() {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@asme.org',
        password: 'admin123',
      })
      .expect(200);

    return response.body.access_token as string;
  }

  async function registerAndLoginUser() {
    await registerAndVerifyUser(app);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'alumno@asme.org',
        password: '123456',
      })
      .expect(200);

    return response.body.access_token as string;
  }

  it('creates and updates event photos with multipart requests', async () => {
    const adminToken = await loginAsAdmin();

    const createEventoResponse = await request(app.getHttpServer())
      .post('/eventos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Congreso ASME 2026')
      .field('tipo', 'Evento especial')
      .field('fecha', '2026-08-10')
      .field('direccion', 'Av. Siempre Viva 123')
      .field('descripcion', 'Evento anual con expositores invitados.')
      .attach('foto', Buffer.from('foto evento inicial'), 'evento-inicial.png')
      .expect(201);

    expect(createEventoResponse.body.imagenUrl).toContain(
      'https://storage.test/',
    );

    const eventoId = createEventoResponse.body.eventoId;

    const updatedEventoResponse = await request(app.getHttpServer())
      .patch(`/eventos/${eventoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('eliminarFoto', 'true')
      .expect(200);

    expect(updatedEventoResponse.body.imagenUrl).toBeNull();

    const replacedPhotoResponse = await request(app.getHttpServer())
      .patch(`/eventos/${eventoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('foto', Buffer.from('foto evento nueva'), 'evento-nuevo.png')
      .expect(200);

    expect(replacedPhotoResponse.body.imagenUrl).toContain(
      'https://storage.test/',
    );
  });

  it('creates, lists, updates and deletes patrocinadores with admin-only writes', async () => {
    const adminToken = await loginAsAdmin();
    const userToken = await registerAndLoginUser();

    await request(app.getHttpServer())
      .post('/patrocinadores')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre: 'SolidWorks',
      })
      .expect(403);

    const createResponse = await request(app.getHttpServer())
      .post('/patrocinadores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'SolidWorks',
        email: 'contacto@solidworks.com',
        link: 'https://www.solidworks.com/',
        imagenUrl: 'https://example.com/patrocinadores/solidworks.png',
      })
      .expect(201);

    const patrocinadorId = createResponse.body.patrocinadorId;

    const listResponse = await request(app.getHttpServer())
      .get('/patrocinadores')
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      patrocinadorId,
      nombre: 'SolidWorks',
      email: 'contacto@solidworks.com',
    });

    await request(app.getHttpServer())
      .get(`/patrocinadores/${patrocinadorId}`)
      .expect(200)
      .expect({
        patrocinadorId,
        nombre: 'SolidWorks',
        email: 'contacto@solidworks.com',
        link: 'https://www.solidworks.com/',
        imagenUrl: 'https://example.com/patrocinadores/solidworks.png',
      });

    await request(app.getHttpServer())
      .patch(`/patrocinadores/${patrocinadorId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Dassault Systemes',
        link: 'https://www.3ds.com/',
      })
      .expect(200)
      .expect({
        patrocinadorId,
        nombre: 'Dassault Systemes',
        email: 'contacto@solidworks.com',
        link: 'https://www.3ds.com/',
        imagenUrl: 'https://example.com/patrocinadores/solidworks.png',
      });

    await request(app.getHttpServer())
      .delete(`/patrocinadores/${patrocinadorId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect({ deleted: true });

    await request(app.getHttpServer())
      .get(`/patrocinadores/${patrocinadorId}`)
      .expect(404);
  });

  it('associates patrocinadores to eventos and rejects nonexistent patrocinadorIds', async () => {
    const adminToken = await loginAsAdmin();

    const firstPatrocinadorResponse = await request(app.getHttpServer())
      .post('/patrocinadores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'SolidWorks',
        link: 'https://www.solidworks.com/',
      })
      .expect(201);

    const secondPatrocinadorResponse = await request(app.getHttpServer())
      .post('/patrocinadores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'AutoDesk',
        link: 'https://www.autodesk.com/',
      })
      .expect(201);

    const firstPatrocinadorId = firstPatrocinadorResponse.body.patrocinadorId;
    const secondPatrocinadorId = secondPatrocinadorResponse.body.patrocinadorId;

    const createEventoResponse = await request(app.getHttpServer())
      .post('/eventos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Feria de Proyectos ASME',
        tipo: 'Charla',
        fecha: '2026-05-20',
        direccion: 'Av. Siempre Viva 123',
        sede: 'Sede Distrito Financiero (SDF)',
        barrio: 'Centro',
        provincia: 'Cordoba',
        descripcion: 'Evento institucional abierto para la comunidad.',
        link: 'https://meet.example.com/asme-feria',
        imagenUrl: 'https://example.com/eventos/feria.jpg',
        paginaEvento: 'https://asme.org/eventos/feria-2026',
        patrocinadorIds: [firstPatrocinadorId],
      })
      .expect(201);

    const eventoId = createEventoResponse.body.eventoId;

    const createdEvento = await request(app.getHttpServer())
      .get(`/eventos/${eventoId}`)
      .expect(200);

    expect(createdEvento.body.patrocinadores).toHaveLength(1);
    expect(createdEvento.body.sede).toBe('Sede Distrito Financiero (SDF)');
    expect(createdEvento.body.patrocinadores[0]).toMatchObject({
      patrocinadorId: firstPatrocinadorId,
      nombre: 'SolidWorks',
    });

    const updatedEvento = await request(app.getHttpServer())
      .patch(`/eventos/${eventoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patrocinadorIds: [secondPatrocinadorId],
      })
      .expect(200);

    expect(updatedEvento.body.patrocinadores).toHaveLength(1);
    expect(updatedEvento.body.patrocinadores[0]).toMatchObject({
      patrocinadorId: secondPatrocinadorId,
      nombre: 'AutoDesk',
    });

    const invalidCreateResponse = await request(app.getHttpServer())
      .post('/eventos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Evento invalido',
        tipo: 'Charla',
        fecha: '2026-06-01',
        direccion: 'Av. Siempre Viva 123',
        descripcion: 'Evento con patrocinadores inexistentes.',
        patrocinadorIds: [9999],
      })
      .expect(404);

    expect(invalidCreateResponse.body.message).toBe(
      'Patrocinadores no encontrados: 9999',
    );

    const invalidUpdateResponse = await request(app.getHttpServer())
      .patch(`/eventos/${eventoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patrocinadorIds: [secondPatrocinadorId, 9999],
      })
      .expect(404);

    expect(invalidUpdateResponse.body.message).toBe(
      'Patrocinadores no encontrados: 9999',
    );
  });
});
