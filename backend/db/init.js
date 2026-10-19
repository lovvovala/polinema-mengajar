import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Skema database berhasil dibuat.');
  } catch (err) {
    console.error('Gagal membuat skema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
