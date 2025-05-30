import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URI,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

const runMigrations = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    await AppDataSource.runMigrations();
    console.log('Migrations have been run successfully!');
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
  } finally {
    await AppDataSource.destroy();
  }
};

if (require.main === module) {
  runMigrations();
}

export default AppDataSource;
