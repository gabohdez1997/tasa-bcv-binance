<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		// Check initial theme
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;

		if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	});
</script>

<div
	class="min-h-screen liquid-gradient text-slate-900 dark:text-slate-100 selection:bg-blue-500/30"
>
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
	}
</style>
