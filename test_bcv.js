import { JSDOM } from 'jsdom';
import Database from 'better-sqlite3';

async function test() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const db = new Database('test.db');
    db.exec(`CREATE TABLE IF NOT EXISTS rates (date TEXT PRIMARY KEY, rate REAL, source TEXT)`);

    try {
        console.log('Fetching BCV (ignoring SSL errors via env)...');

        const response = await fetch('https://www.bcv.org.ve/');
        const html = await response.text();

        console.log('HTML Length:', html.length);

        // Targeted Regex for the Dollar section
        const match = html.match(/id=["']dolar["'][^>]*>.*?<strong>\s*([\d,.]+)\s*<\/strong>/is);

        if (match) {
            console.log('Regex Match found!');
            const rateStr = match[1].trim().replace(',', '.');
            const rate = parseFloat(rateStr);
            console.log('Parsed Rate:', rate);
            const today = new Date().toISOString().split('T')[0];
            db.prepare('INSERT OR REPLACE INTO rates (date, rate, source) VALUES (?, ?, ?)').run(today, rate, 'BCV Direct');
            console.log('Saved to DB');
        } else {
            console.log('No direct match. Trying backup search...');
            // Backup search if exact ID structure changed
            const backupMatch = html.match(/USD.*?<strong>\s*([\d,.]+)\s*<\/strong>/is);
            if (backupMatch) {
                console.log('Backup Match found:', backupMatch[1]);
            } else {
                console.log('No matches found. Check HTML structure.');
                // console.log(html.substring(0, 1000));
            }
        }
    } catch (e) {
        console.error('Test Error:', e);
    }
}

test();
