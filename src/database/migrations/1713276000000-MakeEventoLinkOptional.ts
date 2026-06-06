import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeEventoLinkOptional1713276000000
  implements MigrationInterface
{
  name = 'MakeEventoLinkOptional1713276000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      ALTER COLUMN "link" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evento"
      ALTER COLUMN "link" SET NOT NULL
    `);
  }
}
