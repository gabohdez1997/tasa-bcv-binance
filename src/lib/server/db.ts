import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'bcv_rates.db');
const db = new Database(dbPath);

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS rates (
        date TEXT PRIMARY KEY,
        rate REAL NOT NULL,
        source TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

export function getRate(date: string) {
    const stmt = db.prepare('SELECT * FROM rates WHERE date = ?');
    return stmt.get(date);
}

export function saveRate(date: string, rate: number, source: string) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO rates (date, rate, source, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(date, rate, source);
}

export default db;
