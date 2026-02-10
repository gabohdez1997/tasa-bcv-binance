
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { asset = 'USDT', fiat = 'VES', tradeType = 'BUY', transAmount = 0, filterType = 'p2p' } = body;

        const publisherType = filterType === 'block' ? 'merchant' : null;
        const classify = filterType === 'block' ? 'BLOCK' : null;

        const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: JSON.stringify({
                asset,
                fiat,
                tradeType,
                page: 1,
                rows: 20,
                payTypes: [],
                countries: [],
                publisherType, // "merchant" for verified merchants
                classify, // "BLOCK" for the Block Trade zone
                transAmount,
            })
        });

        if (!response.ok) {
            return json({ error: 'Failed to fetch data from Binance' }, { status: response.status });
        }

        const data = await response.json();

        //if (data.data && Array.isArray(data.data)) {
        // Sort by monthOrderCount descending
        //data.data.sort((a: any, b: any) => (b.advertiser.monthOrderCount || 0) - (a.advertiser.monthOrderCount || 0));
        //}

        return json(data);
    } catch (error) {
        console.error('Error fetching P2P data:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
