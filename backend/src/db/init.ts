import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './connection';

async function initDatabase() {
  try {
    console.log('📊 Initializing database...');

    // Читаем SQL файл миграции
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );

    // Выполняем миграцию
    await pool.query(migrationSQL);

    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

