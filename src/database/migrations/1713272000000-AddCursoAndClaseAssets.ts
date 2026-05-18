import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCursoAndClaseAssets1713272000000 implements MigrationInterface {
  name = 'AddCursoAndClaseAssets1713272000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cursos"
      ADD COLUMN IF NOT EXISTS "imagen_storage_path" character varying
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "curso_archivos" (
        "curso_archivo_id" SERIAL NOT NULL,
        "curso_id" integer NOT NULL,
        "nombre_original" character varying NOT NULL,
        "storage_path" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "size" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_curso_archivos_curso_archivo_id" PRIMARY KEY ("curso_archivo_id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_curso_archivos_storage_path"
      ON "curso_archivos" ("storage_path")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_curso_archivos_curso_id"
      ON "curso_archivos" ("curso_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clase_archivos" (
        "clase_archivo_id" SERIAL NOT NULL,
        "clase_id" integer NOT NULL,
        "nombre_original" character varying NOT NULL,
        "storage_path" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "size" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clase_archivos_clase_archivo_id" PRIMARY KEY ("clase_archivo_id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_clase_archivos_storage_path"
      ON "clase_archivos" ("storage_path")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clase_archivos_clase_id"
      ON "clase_archivos" ("clase_id")
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
          WHERE rel.relname = 'curso_archivos'
            AND con.contype = 'f'
            AND att.attname = 'curso_id'
        LOOP
          EXECUTE format('ALTER TABLE "curso_archivos" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_curso_archivos_curso'
        ) THEN
          ALTER TABLE "curso_archivos"
          ADD CONSTRAINT "FK_curso_archivos_curso"
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
          WHERE rel.relname = 'clase_archivos'
            AND con.contype = 'f'
            AND att.attname = 'clase_id'
        LOOP
          EXECUTE format('ALTER TABLE "clase_archivos" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_clase_archivos_clase'
        ) THEN
          ALTER TABLE "clase_archivos"
          ADD CONSTRAINT "FK_clase_archivos_clase"
          FOREIGN KEY ("clase_id") REFERENCES "clases"("clase_id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "clase_archivos"');
    await queryRunner.query('DROP TABLE IF EXISTS "curso_archivos"');
    await queryRunner.query(`
      ALTER TABLE "cursos"
      DROP COLUMN IF EXISTS "imagen_storage_path"
    `);
  }
}
