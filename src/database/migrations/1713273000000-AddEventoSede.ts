import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventoSede1713273000000 implements MigrationInterface {
  name = 'AddEventoSede1713273000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      ADD COLUMN IF NOT EXISTS "sede" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      DROP COLUMN IF EXISTS "sede"
    `);
  }
}
