import { join } from 'path';

let db: any = null;

async function initDb() {
    if (db !== null) return db;

    try {
        const { default: Database } = await import('better-sqlite3');
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
        return db;
    } catch (error) {
        console.warn('Database initialization failed. Running without persistence:', error);
        db = false; // Mark as failed to avoid retrying every time
        return null;
    }
}

export async function getRate(date: string) {
    const database = await initDb();
    if (!database) return null;
    try {
        const stmt = database.prepare('SELECT * FROM rates WHERE date = ?');
        return stmt.get(date);
    } catch (e) {
        return null;
    }
}

export async function saveRate(date: string, rate: number, source: string) {
    const database = await initDb();
    if (!database) return;
    try {
        const stmt = database.prepare(`
            INSERT OR REPLACE INTO rates (date, rate, source, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(date, rate, source);
    } catch (e) {
        console.warn('Failed to save rate to database:', e);
    }
}

export default db;
