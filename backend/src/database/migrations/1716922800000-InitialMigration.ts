import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class InitialMigration1716922800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = fs.readFileSync(path.join(__dirname, './tables.sql'), 'utf8');
    const policies = fs.readFileSync(path.join(__dirname, './policies.sql'), 'utf8');
    const functions = fs.readFileSync(path.join(__dirname, './functions.sql'), 'utf8');
    
    await queryRunner.query(tables);
    await queryRunner.query(policies);
    await queryRunner.query(functions);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: implement SQL to revert changes
  }
}
