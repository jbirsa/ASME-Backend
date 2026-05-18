import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventoImageStoragePath1713274000000
  implements MigrationInterface
{
  name = 'AddEventoImageStoragePath1713274000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      ADD COLUMN IF NOT EXISTS "imagen_storage_path" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      DROP COLUMN IF EXISTS "imagen_storage_path"
    `);
  }
}
