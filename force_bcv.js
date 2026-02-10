import Database from 'better-sqlite3';

async function forceUpdate() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const db = new Database('bcv_rates.db');

    try {
        console.log('Forcing BCV Scrape...');
        const response = await fetch('https://www.bcv.org.ve/');
        const html = await response.text();
        const match = html.match(/id=["']dolar["'][^>]*>.*?<strong>\s*([\d,.]+)\s*<\/strong>/is);

        if (match) {
            const rate = parseFloat(match[1].trim().replace(',', '.'));
            const today = new Date().toLocaleDateString('en-CA');
            db.prepare('INSERT OR REPLACE INTO rates (date, rate, source) VALUES (?, ?, ?)').run(today, rate, 'BCV Direct');
            console.log(`Success! Updated today (${today}) with rate ${rate} from BCV Direct.`);
        } else {
            console.log('Failed to find rate in HTML.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

forceUpdate();
