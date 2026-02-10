<script lang="ts">
    import { onMount } from "svelte";

    let p2pAds: any[] = [];
    let blockAds: any[] = [];
    let p2pAverage = 0;
    let blockAverage = 0;
    let loading = true;
    let transAmount = 15000000;
    let bcvRate: any = null;
    let selectedDate = new Date().toISOString().split("T")[0];
    let bcvLoading = false;
    let error: string | null = null;
    let isDark = false;

    async function fetchAds(filterType: "p2p" | "block", amount: number) {
        const response = await fetch("/api/p2p", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                asset: "USDT",
                fiat: "VES",
                tradeType: "BUY",
                transAmount: amount,
                filterType,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${filterType} data`);
        }

        const data = await response.json();
        return data.data && Array.isArray(data.data) ? data.data : [];
    }

    async function fetchBCV(date?: string) {
        bcvLoading = true;
        try {
            const url = date ? `/api/bcv?date=${date}` : "/api/bcv";
            const response = await fetch(url);
            if (!response.ok) throw new Error("Error obteniendo BCV");
            bcvRate = await response.json();
        } catch (e) {
            console.error(e);
        } finally {
            bcvLoading = false;
        }
    }

    async function refreshData() {
        loading = true;
        error = null;
        try {
            const [p2pData, blockData] = await Promise.all([
                fetchAds("p2p", 0),
                fetchAds("block", transAmount),
            ]);

            p2pAds = p2pData;
            blockAds = blockData;

            p2pAverage = calculateAverage(p2pAds);
            blockAverage = calculateAverage(blockAds);
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function calculateAverage(ads: any[]) {
        if (ads.length === 0) return 0;
        const total = ads.reduce(
            (sum, ad) => sum + parseFloat(ad.adv.price),
            0,
        );
        return total / ads.length;
    }

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }

    onMount(() => {
        isDark = document.documentElement.classList.contains("dark");
        refreshData();
        fetchBCV();
    });

    $: differential =
        bcvRate && blockAverage > 0
            ? (blockAverage / parseFloat(bcvRate.promedio) - 1) * 100
            : 0;

    // function handleDateChange() {
    //     fetchBCV(selectedDate);
    // }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header with Theme Toggle -->
    <div class="flex justify-between items-center mb-12">
        <h1
            class="text-3xl font-black tracking-tight text-blue-900 dark:text-blue-200"
        >
            Tasas de Cambio en Venezuela
        </h1>
        <button
            on:click={toggleTheme}
            class="p-2 rounded-full glass hover:scale-110 transition-transform duration-200"
            aria-label="Toggle theme"
        >
            {#if isDark}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 text-yellow-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path
                        d="M12 20v2"
                    /><path d="m4.93 4.93 1.41 1.41" /><path
                        d="m17.66 17.66 1.41 1.41"
                    /><path d="M2 12h2" /><path d="M20 12h2" /><path
                        d="m6.34 17.66-1.41 1.41"
                    /><path d="m19.07 4.93-1.41 1.41" /></svg
                >
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 text-slate-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
                >
            {/if}
        </button>
    </div>

    <!-- Dashboard Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <!-- BCV Card -->
        <div
            class="glass-card flex flex-col items-center justify-center text-center h-full"
        >
            <span
                class="text-xs font-black uppercase tracking-[0.2em] text-blue-900 dark:text-blue-300 mb-3 transition-colors duration-300"
                >Tasa BCV Oficial</span
            >
            {#if bcvLoading}
                <div
                    class="h-10 w-24 bg-blue-100 dark:bg-blue-900/40 animate-pulse rounded-lg"
                ></div>
            {:else if bcvRate}
                <div class="flex items-baseline gap-1.5">
                    <span
                        class="text-4xl font-mono font-black text-blue-900 dark:text-blue-50"
                    >
                        {parseFloat(bcvRate.promedio).toFixed(2)}
                    </span>
                    <span
                        class="text-xs font-black text-blue-800/40 dark:text-blue-200/40"
                        >VES</span
                    >
                </div>
                <div
                    class="mt-3 text-xs text-blue-800/40 dark:text-blue-200/40 uppercase tracking-tighter"
                >
                    Fuente: {bcvRate.fuente === "BCV Direct"
                        ? "BCV"
                        : bcvRate.fuente}
                </div>
            {/if}
        </div>

        <!-- Binance Card -->
        <div
            class="glass-card flex flex-col items-center justify-center text-center h-full"
        >
            <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900 dark:text-blue-300 mb-3 text-center w-full transition-colors duration-300"
                >Promedio Bloque</span
            >
            {#if loading}
                <div
                    class="h-10 w-24 bg-blue-100 dark:bg-blue-900/40 animate-pulse rounded-lg"
                ></div>
            {:else}
                <div class="flex items-baseline gap-1.5">
                    <span
                        class="text-4xl font-mono font-black text-blue-900 dark:text-blue-50"
                    >
                        {blockAverage > 0
                            ? blockAverage.toFixed(2)
                            : p2pAverage.toFixed(2)}
                    </span>
                    <span
                        class="text-xs font-black text-blue-800/40 dark:text-blue-200/40"
                        >VES</span
                    >
                </div>
                <div
                    class="mt-3 text-xs text-blue-800/40 dark:text-blue-200/40 uppercase tracking-tighter"
                >
                    Fuente: Binance
                </div>
            {/if}
        </div>

        <!-- Differential Card -->
        <div
            class="glass-card flex flex-col items-center justify-center text-center h-full"
        >
            <span
                class="text-xs font-black uppercase tracking-[0.2em] text-blue-900 dark:text-blue-300 mb-3 transition-colors duration-300"
                >Diferencial</span
            >
            {#if loading}
                <div
                    class="h-10 w-24 bg-blue-100 dark:bg-blue-900/40 animate-pulse rounded-lg"
                ></div>
            {:else}
                <div class="flex items-baseline gap-1">
                    <span
                        class="text-4xl font-mono font-black {differential < 0
                            ? 'text-red-500'
                            : 'text-blue-900 dark:text-blue-50'}"
                    >
                        {differential.toFixed(2)}%
                    </span>
                </div>
                <div
                    class="mt-3 text-xs text-blue-800/40 dark:text-blue-200/40 uppercase tracking-tighter"
                >
                    Cálculo BCV / Binance
                </div>
            {/if}
        </div>

        <!-- Filter Card -->
        <div
            class="glass-card flex flex-col items-center justify-center text-center h-full border-blue-500/30"
        >
            <span
                class="text-xs font-black uppercase tracking-[0.2em] text-blue-900 dark:text-blue-300 mb-3 transition-colors duration-300"
                >Monto Transaccion</span
            >
            <div class="flex flex-col w-full gap-2">
                <input
                    id="amount"
                    type="number"
                    bind:value={transAmount}
                    on:change={refreshData}
                    class="bg-blue-50/50 dark:bg-black/40 border border-blue-200/50 dark:border-blue-800/50 focus:ring-2 focus:ring-blue-600 rounded-lg px-2 py-1.5 w-full font-mono font-black text-center text-blue-900 dark:text-blue-50 text-sm"
                />
                <button
                    on:click={refreshData}
                    disabled={loading}
                    class="w-full py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    {loading ? "..." : "Actualizar"}
                </button>
            </div>
        </div>
    </div>

    {#if error}
        <div
            class="p-4 mb-8 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl glass border-red-500/50"
        >
            <strong>Error:</strong>
            {error}
        </div>
    {/if}

    <!-- Tables Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-1 gap-8">
        <!-- Block Section -->
        <div class="flex flex-col">
            <h2
                class="text-xl font-black mb-4 px-2 flex justify-between items-center text-blue-900 dark:text-blue-200 transition-colors duration-300"
            >
                <span>Compra por Bloques (Merchant)</span>
                <span
                    class="text-xs font-bold text-blue-900 dark:text-blue-200 transition-colors duration-300"
                    >{blockAds.length} anuncios</span
                >
            </h2>
            <div class="glass overflow-hidden rounded-2xl border-blue-600/30">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead
                            class="bg-blue-100/50 dark:bg-blue-900/50 font-black uppercase text-[10px] tracking-widest text-blue-900/80 dark:text-blue-200 transition-colors duration-300"
                        >
                            <tr>
                                <th class="px-4 py-4">Anunciante</th>
                                <th class="px-4 py-4">Confianza</th>
                                <th class="px-4 py-4">Precio</th>
                                <th class="px-4 py-4 text-right">Límites</th>
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-blue-100/20 dark:divide-blue-800/30"
                        >
                            {#each blockAds as ad}
                                <tr
                                    class="hover:bg-blue-600/10 transition-colors"
                                >
                                    <td
                                        class="px-4 py-4 font-semibold flex items-center gap-2"
                                    >
                                        {ad.advertiser.nickName}
                                        {#if ad.advertiser.userType === "merchant"}
                                            <span
                                                class="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-900 text-[10px] font-bold"
                                                >M</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="flex flex-col">
                                            <span
                                                >{ad.advertiser.monthOrderCount}
                                                ord.</span
                                            >
                                            <span
                                                class="text-[10px] text-green-500"
                                                >{(
                                                    ad.advertiser
                                                        .monthFinishRate * 100
                                                ).toFixed(1)}%</span
                                            >
                                        </div>
                                    </td>
                                    <td
                                        class="px-4 py-4 font-mono font-black text-blue-800 dark:text-blue-200 text-lg"
                                        >{parseFloat(ad.adv.price).toFixed(2)} VES</td
                                    >
                                    <td
                                        class="px-4 py-4 text-right tabular-nums text-slate-400 text-xs"
                                    >
                                        {parseFloat(
                                            ad.adv.minSingleTransAmount,
                                        ).toLocaleString()} - {parseFloat(
                                            ad.adv.maxSingleTransAmount,
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- P2P General -->
        <!-- <div class="flex flex-col">
            <h2
                class="text-xl font-bold mb-4 px-2 flex justify-between items-center"
            >
                <span>Compra P2P (General)</span>
                <span class="text-xs font-normal text-slate-500"
                    >{p2pAds.length} anuncios encontrados</span
                >
            </h2>
            <div class="glass overflow-hidden rounded-2xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead
                            class="bg-slate-50/50 dark:bg-white/5 font-bold uppercase text-[10px] tracking-widest text-slate-500"
                        >
                            <tr>
                                <th class="px-4 py-4">Comerciante</th>
                                <th class="px-4 py-4">Confianza</th>
                                <th class="px-4 py-4">Precio</th>
                                <th class="px-4 py-4 text-right">Límites</th>
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-slate-100/10 dark:divide-white/5"
                        >
                            {#each p2pAds as ad}
                                <tr
                                    class="hover:bg-blue-500/5 transition-colors"
                                >
                                    <td class="px-4 py-4 font-semibold"
                                        >{ad.advertiser.nickName}</td
                                    >
                                    <td class="px-4 py-4">
                                        <div class="flex flex-col">
                                            <span
                                                >{ad.advertiser.monthOrderCount}
                                                ord.</span
                                            >
                                            <span
                                                class="text-[10px] text-green-500"
                                                >{(
                                                    ad.advertiser
                                                        .monthFinishRate * 100
                                                ).toFixed(1)}%</span
                                            >
                                        </div>
                                    </td>
                                    <td
                                        class="px-4 py-4 font-mono font-bold text-blue-600 dark:text-blue-400"
                                        >{parseFloat(ad.adv.price).toFixed(
                                            2,
                                        )}</td
                                    >
                                    <td
                                        class="px-4 py-4 text-right tabular-nums text-slate-400 text-xs"
                                    >
                                        {parseFloat(
                                            ad.adv.minSingleTransAmount,
                                        ).toLocaleString()} - {parseFloat(
                                            ad.adv.maxSingleTransAmount,
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div> -->
    </div>
</div>

<style>
    /* Tailwind utilities are used exclusively */
</style>
