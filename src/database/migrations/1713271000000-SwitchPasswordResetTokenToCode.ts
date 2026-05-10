import { MigrationInterface, QueryRunner } from 'typeorm';

export class SwitchPasswordResetTokenToCode1713271000000 implements MigrationInterface {
  name = 'SwitchPasswordResetTokenToCode1713271000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "password_resets"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_password_resets_token_hash_unique"',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" DROP COLUMN IF EXISTS "token_hash"',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" ADD COLUMN IF NOT EXISTS "code_hash" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" ALTER COLUMN "code_hash" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" ADD COLUMN IF NOT EXISTS "failed_attempts" integer NOT NULL DEFAULT 0',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "password_resets"');
    await queryRunner.query(
      'ALTER TABLE "password_resets" DROP COLUMN IF EXISTS "failed_attempts"',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" DROP COLUMN IF EXISTS "code_hash"',
    );
    await queryRunner.query(
      'ALTER TABLE "password_resets" ADD COLUMN IF NOT EXISTS "token_hash" character varying NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_password_resets_token_hash_unique" ON "password_resets" ("token_hash")',
    );
  }
}
