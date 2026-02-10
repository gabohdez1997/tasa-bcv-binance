import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRate, saveRate } from '$lib/server/db';
import { JSDOM } from 'jsdom';

// Allow unauthorized SSL for BCV website (common for .gob.ve sites)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function scrapeBCV() {
    try {
        const response = await fetch('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        console.log(`BCV Scraping: HTML length ${html.length}`);

        // Regex is more robust for this specific site
        const match = html.match(/id=["']dolar["'][^>]*>.*?<strong>\s*([\d,.]+)\s*<\/strong>/is);
        if (match) {
            console.log(`BCV Scraping: Found match: ${match[1]}`);
            const rateStr = match[1].trim().replace(',', '.');
            const rate = parseFloat(rateStr);
            if (!isNaN(rate)) return rate;
        } else {
            console.log("BCV Scraping: No match found. Searching backup...");
            const backup = html.match(/USD.*?<strong>\s*([\d,.]+)\s*<\/strong>/is);
            if (backup) {
                console.log(`BCV Scraping: Backup match found: ${backup[1]}`);
                const rate = parseFloat(backup[1].trim().replace(',', '.'));
                if (!isNaN(rate)) return rate;
            }
        }

        // DOM Fallback
        const dom = new JSDOM(html);
        const dolarElement = dom.window.document.querySelector('#dolar strong');
        if (dolarElement) {
            const rateStr = dolarElement.textContent?.trim().replace(',', '.') || '';
            const rate = parseFloat(rateStr);
            if (!isNaN(rate)) return rate;
        }
    } catch (e) {
        console.error('Scraping error:', e);
    }
    return null;
}

async function fetchFromDolarApi() {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        if (response.ok) {
            const data = await response.json();
            const bcv = data.find((item: any) => item.fuente === 'oficial');
            if (bcv) return bcv.promedio;
        }
    } catch (e) {
        console.error('DolarApi error:', e);
    }
    return null;
}

export const GET: RequestHandler = async ({ url }) => {
    try {
        const dateParam = url.searchParams.get('date');
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        const targetDate = dateParam || today;

        // 1. Check Database
        const cached = getRate(targetDate) as any;
        if (cached) {
            return json({ promedio: cached.rate, fuente: cached.source, date: cached.date });
        }

        // 2. If Today (or requested today), Scrape or Fetch
        if (targetDate === today) {
            console.log(`Fetching rate for today: ${today}`);
            let rate = await scrapeBCV();
            let source = 'BCV Direct';

            if (!rate) {
                console.log('BCV Scraping failed, trying DolarApi...');
                rate = await fetchFromDolarApi();
                source = 'DolarApi Fallback';
            }

            if (rate) {
                try {
                    saveRate(today, rate, source);
                } catch (e) {
                    console.warn('Could not save rate to DB (standard on Vercel):', e);
                }
                return json({ promedio: rate, fuente: source, date: today });
            }
        }

        return json({
            error: 'Rate not found for this date',
            message: "La consulta histórica por ahora solo funciona para fechas que se hayan consultado hoy o que se agreguen desde el SQL."
        }, { status: 404 });

    } catch (error) {
        console.error('Error in BCV API:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
