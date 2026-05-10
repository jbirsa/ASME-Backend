import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1713270000000 implements MigrationInterface {
  name = 'InitSchema1713270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuarios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "nombre" character varying,
        "rol" character varying NOT NULL DEFAULT 'user',
        "password" character varying,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuarios_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_usuarios_email" ON "usuarios" ("email")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cursos" (
        "curso_id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "descripcion" character varying,
        "imagen_url" character varying,
        "estado" character varying,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cursos_curso_id" PRIMARY KEY ("curso_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clases" (
        "clase_id" SERIAL NOT NULL,
        "curso_id" integer,
        "titulo" character varying NOT NULL,
        "descripcion" character varying,
        "video_url" character varying,
        "orden" integer,
        CONSTRAINT "PK_clases_clase_id" PRIMARY KEY ("clase_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inscripciones" (
        "usuario_id" uuid NOT NULL,
        "curso_id" integer NOT NULL,
        "estado" character varying NOT NULL DEFAULT 'en_progreso',
        "calificacion" numeric,
        "fecha_inscripcion" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inscripciones" PRIMARY KEY ("usuario_id", "curso_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" SERIAL NOT NULL,
        "user_id" uuid,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_resets_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_password_resets_token_hash_unique" ON "password_resets" ("token_hash")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patrocinador" (
        "patrocinador_id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "email" character varying,
        "link" character varying,
        "imagen_url" character varying,
        CONSTRAINT "PK_patrocinador_id" PRIMARY KEY ("patrocinador_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "evento" (
        "evento_id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "tipo" character varying,
        "fecha" date,
        "direccion" character varying,
        "barrio" character varying,
        "provincia" character varying,
        "descripcion" character varying,
        "link" character varying,
        "imagen_url" character varying,
        "pagina_evento" character varying,
        CONSTRAINT "PK_evento_id" PRIMARY KEY ("evento_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patrocina_a" (
        "evento_id" integer NOT NULL,
        "patrocinador_id" integer NOT NULL,
        CONSTRAINT "PK_patrocina_a" PRIMARY KEY ("evento_id", "patrocinador_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'clases'
            AND con.contype = 'f'
            AND att.attname = 'curso_id'
        LOOP
          EXECUTE format('ALTER TABLE "clases" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_clases_curso'
        ) THEN
          ALTER TABLE "clases"
          ADD CONSTRAINT "FK_clases_curso"
          FOREIGN KEY ("curso_id") REFERENCES "cursos"("curso_id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'inscripciones'
            AND con.contype = 'f'
            AND att.attname = 'curso_id'
        LOOP
          EXECUTE format('ALTER TABLE "inscripciones" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_inscripciones_curso'
        ) THEN
          ALTER TABLE "inscripciones"
          ADD CONSTRAINT "FK_inscripciones_curso"
          FOREIGN KEY ("curso_id") REFERENCES "cursos"("curso_id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'inscripciones'
            AND con.contype = 'f'
            AND att.attname = 'usuario_id'
        LOOP
          EXECUTE format('ALTER TABLE "inscripciones" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_inscripciones_usuario'
        ) THEN
          ALTER TABLE "inscripciones"
          ADD CONSTRAINT "FK_inscripciones_usuario"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'password_resets'
            AND con.contype = 'f'
            AND att.attname = 'user_id'
        LOOP
          EXECUTE format('ALTER TABLE "password_resets" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_password_resets_user'
        ) THEN
          ALTER TABLE "password_resets"
          ADD CONSTRAINT "FK_password_resets_user"
          FOREIGN KEY ("user_id") REFERENCES "usuarios"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'patrocina_a'
            AND con.contype = 'f'
            AND att.attname IN ('evento_id', 'patrocinador_id')
        LOOP
          EXECUTE format('ALTER TABLE "patrocina_a" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_patrocina_a_evento'
        ) THEN
          ALTER TABLE "patrocina_a"
          ADD CONSTRAINT "FK_patrocina_a_evento"
          FOREIGN KEY ("evento_id") REFERENCES "evento"("evento_id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_patrocina_a_patrocinador'
        ) THEN
          ALTER TABLE "patrocina_a"
          ADD CONSTRAINT "FK_patrocina_a_patrocinador"
          FOREIGN KEY ("patrocinador_id") REFERENCES "patrocinador"("patrocinador_id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "patrocina_a"');
    await queryRunner.query('DROP TABLE IF EXISTS "evento"');
    await queryRunner.query('DROP TABLE IF EXISTS "patrocinador"');
    await queryRunner.query('DROP TABLE IF EXISTS "password_resets"');
    await queryRunner.query('DROP TABLE IF EXISTS "inscripciones"');
    await queryRunner.query('DROP TABLE IF EXISTS "clases"');
    await queryRunner.query('DROP TABLE IF EXISTS "cursos"');
    await queryRunner.query('DROP TABLE IF EXISTS "usuarios"');
  }
}
