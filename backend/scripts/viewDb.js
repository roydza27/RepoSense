/**
 * Standalone Database Viewer Script
 * Usage: node scripts/viewDb.js
 * 
 * Displays the contents of the SQLite database
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../reposense.db');

const db = new Database(dbPath, { readonly: true });

console.log(`\n--- 📜 READING FROM: ${dbPath} ---\n`);

try {
  // Get all table names
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map(t => t.name);

  if (tables.length === 0) {
    console.log('❌ No tables found in database.');
  } else {
    console.log(`📋 Available Tables: ${tables.join(', ')}\n`);

    for (const table of tables) {
      console.log(`\n========== TABLE: ${table.toUpperCase()} ==========`);

      const records = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();

      if (records.length === 0) {
        console.log('  (Empty table)');
      } else {
        console.table(records);
        console.log(`  Total Records: ${records.length}`);
      }
    }
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('\n✅ Database viewer closed.\n');
}
