import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1713275000000 implements MigrationInterface {
  name = 'AddEmailVerification1713275000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMPTZ',
    );
    await queryRunner.query(
      'UPDATE "usuarios" SET "email_verified_at" = NOW() WHERE "email_verified_at" IS NULL',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verifications" (
        "id" SERIAL NOT NULL,
        "user_id" uuid,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_verifications_token_hash_unique" ON "email_verifications" ("token_hash")',
    );

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'email_verifications'
            AND con.contype = 'f'
            AND att.attname = 'user_id'
        LOOP
          EXECUTE format('ALTER TABLE "email_verifications" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_email_verifications_user'
        ) THEN
          ALTER TABLE "email_verifications"
          ADD CONSTRAINT "FK_email_verifications_user"
          FOREIGN KEY ("user_id") REFERENCES "usuarios"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_email_verifications_token_hash_unique"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "email_verifications"');
    await queryRunner.query(
      'ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "email_verified_at"',
    );
  }
}
