import Database from 'better-sqlite3';
import { join } from 'path';

let db: any = null;

try {
    const dbPath = join(process.cwd(), 'bcv_rates.db');
    db = new Database(dbPath);

    // Initialize table
    db.exec(`
        CREATE TABLE IF NOT EXISTS rates (
            date TEXT PRIMARY KEY,
            rate REAL NOT NULL,
            source TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
} catch (error) {
    console.warn('Database initialization failed. Running in memory or without persistence:', error);
    db = null;
}

export function getRate(date: string) {
    if (!db) return null;
    try {
        const stmt = db.prepare('SELECT * FROM rates WHERE date = ?');
        return stmt.get(date);
    } catch (e) {
        return null;
    }
}

export function saveRate(date: string, rate: number, source: string) {
    if (!db) return;
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO rates (date, rate, source, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(date, rate, source);
    } catch (e) {
        console.warn('Failed to save rate to database:', e);
    }
}

export default db;
